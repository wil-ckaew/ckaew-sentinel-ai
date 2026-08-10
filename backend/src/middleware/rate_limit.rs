use actix_web::{
    dev::{Service, ServiceRequest, ServiceResponse, Transform},
    Error, HttpResponse,
};
use dashmap::DashMap;
use std::future::{ready, Ready};
use std::sync::Arc;
use std::time::{Duration, Instant};

pub struct RateLimiter {
    max_requests: usize,
    window: Duration,
    requests: Arc<DashMap<String, Vec<Instant>>>,
}

impl RateLimiter {
    pub fn new(max_requests: usize, window_secs: u64) -> Self {
        Self {
            max_requests,
            window: Duration::from_secs(window_secs),
            requests: Arc::new(DashMap::new()),
        }
    }

    pub fn is_allowed(&self, key: &str) -> bool {
        let now = Instant::now();
        let window = self.window;

        // Limpar entradas antigas
        if let Some(mut timestamps) = self.requests.get_mut(key) {
            timestamps.retain(|&t| t.elapsed() < window);
        }

        // Verificar limite
        let mut timestamps = self.requests.entry(key.to_string()).or_insert_with(Vec::new);
        
        if timestamps.len() >= self.max_requests {
            return false;
        }

        timestamps.push(now);
        true
    }

    pub fn get_remaining(&self, key: &str) -> usize {
        if let Some(timestamps) = self.requests.get(key) {
            let active = timestamps.iter().filter(|&t| t.elapsed() < self.window).count();
            self.max_requests.saturating_sub(active)
        } else {
            self.max_requests
        }
    }
}

// Middleware wrapper
pub struct RateLimitMiddleware {
    limiter: Arc<RateLimiter>,
}

impl RateLimitMiddleware {
    pub fn new(max_requests: usize, window_secs: u64) -> Self {
        Self {
            limiter: Arc::new(RateLimiter::new(max_requests, window_secs)),
        }
    }
}

impl<S, B> Transform<S, ServiceRequest> for RateLimitMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type InitError = ();
    type Transform = RateLimitMiddlewareService<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(RateLimitMiddlewareService {
            service,
            limiter: self.limiter.clone(),
        }))
    }
}

pub struct RateLimitMiddlewareService<S> {
    service: S,
    limiter: Arc<RateLimiter>,
}

impl<S, B> Service<ServiceRequest> for RateLimitMiddlewareService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = S::Future;

    fn poll_ready(
        &self,
        cx: &mut std::task::Context<'_>,
    ) -> std::task::Poll<Result<(), Self::Error>> {
        self.service.poll_ready(cx)
    }

    fn call(&self, req: ServiceRequest) -> Self::Future {
        // Obter IP do cliente
        let ip = req
            .connection_info()
            .realip_remote_addr()
            .unwrap_or("unknown")
            .to_string();

        let key = format!("rate_limit:{}", ip);

        // Verificar rate limit
        if !self.limiter.is_allowed(&key) {
            let (req, _) = req.into_parts();
            return self.service.call(req);
        }

        self.service.call(req)
    }
}
