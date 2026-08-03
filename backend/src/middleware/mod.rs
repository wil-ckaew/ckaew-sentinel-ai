use actix_web::{
    dev::{Service, ServiceRequest, ServiceResponse, Transform},
    Error, HttpMessage,
};
use std::future::{ready, Ready};
use std::rc::Rc;
use futures_util::future::LocalBoxFuture;
use crate::auth;

pub struct AuthMiddleware {
    secret: Rc<Vec<u8>>,
}

impl AuthMiddleware {
    pub fn new(secret: Vec<u8>) -> Self {
        Self {
            secret: Rc::new(secret),
        }
    }
}

impl<S, B> Transform<S, ServiceRequest> for AuthMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type InitError = ();
    type Transform = AuthMiddlewareService<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(AuthMiddlewareService {
            service,
            secret: self.secret.clone(),
        }))
    }
}

pub struct AuthMiddlewareService<S> {
    service: S,
    secret: Rc<Vec<u8>>,
}

impl<S, B> Service<ServiceRequest> for AuthMiddlewareService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    fn poll_ready(
        &self,
        cx: &mut std::task::Context<'_>,
    ) -> std::task::Poll<Result<(), Self::Error>> {
        self.service.poll_ready(cx)
    }

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let secret = self.secret.clone();
        let fut = self.service.call(req);

        Box::pin(async move {
            let auth_header = req.headers().get("Authorization");
            
            if let Some(header_value) = auth_header {
                if let Ok(auth_str) = header_value.to_str() {
                    if auth_str.starts_with("Bearer ") {
                        let token = &auth_str[7..];
                        if let Ok(claims) = crate::auth::verify_token(token, &secret) {
                            req.extensions_mut().insert(claims);
                            return fut.await;
                        }
                    }
                }
            }

            // Se não autenticado, retorna erro 401
            Err(actix_web::error::ErrorUnauthorized("Authentication required"))
        })
    }
}
