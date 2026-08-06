use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use std::time::{SystemTime, UNIX_EPOCH};

const TOKEN_EXPIRATION_HOURS: u64 = 24;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: String,
    pub username: String,
    pub role: String,
    pub exp: usize,
    pub iat: usize,
}

impl Claims {
    pub fn new(user_id: Uuid, username: String, role: String) -> Self {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as usize;

        let exp = now + (TOKEN_EXPIRATION_HOURS * 3600) as usize;

        Self {
            sub: user_id.to_string(),
            username,
            role,
            exp,
            iat: now,
        }
    }

    pub fn user_id(&self) -> Result<Uuid, uuid::Error> {
        Uuid::parse_str(&self.sub)
    }
}

pub fn create_token(
    user_id: Uuid,
    username: String,
    role: String,
    secret: &[u8],
) -> Result<String, jsonwebtoken::errors::Error> {
    let claims = Claims::new(user_id, username, role);
    encode(&Header::default(), &claims, &EncodingKey::from_secret(secret))
}

pub fn verify_token(token: &str, secret: &[u8]) -> Result<Claims, jsonwebtoken::errors::Error> {
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret),
        &Validation::default(),
    )
    .map(|data| data.claims)
}
