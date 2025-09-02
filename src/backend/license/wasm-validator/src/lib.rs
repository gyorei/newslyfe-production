use wasm_bindgen::prelude::*;
use rsa::{RsaPublicKey, Pkcs1v15Sign};
use rsa::pkcs8::DecodePublicKey;
use sha2::{Sha256, Digest};
use base64::{Engine as _, engine::general_purpose};

#[wasm_bindgen]
pub fn alloc(size: usize) -> *mut u8 {
    let mut buf = Vec::with_capacity(size);
    let ptr = buf.as_mut_ptr();
    std::mem::forget(buf);
    ptr
}

#[wasm_bindgen]
pub fn dealloc(ptr: *mut u8, size: usize) {
    unsafe {
        let _ = Vec::from_raw_parts(ptr, 0, size);
    }
}

#[wasm_bindgen]
pub fn validate_signature(
    public_key_ptr: *const u8, public_key_len: usize,
    signature_ptr: *const u8, signature_len: usize,
    payload_ptr: *const u8, payload_len: usize,
) -> i32 {
    let public_key_pem_bytes = unsafe { std::slice::from_raw_parts(public_key_ptr, public_key_len) };
    let signature_b64_bytes = unsafe { std::slice::from_raw_parts(signature_ptr, signature_len) };
    let payload_b64_bytes = unsafe { std::slice::from_raw_parts(payload_ptr, payload_len) };

    let public_key_pem = String::from_utf8_lossy(public_key_pem_bytes);
    let public_key = match rsa::RsaPublicKey::from_public_key_pem(&public_key_pem) {
        Ok(key) => key,
        Err(_) => return 0,
    };

    let payload_bytes = match general_purpose::STANDARD.decode(payload_b64_bytes) {
        Ok(bytes) => bytes,
        Err(_) => return -1,
    };
    let signature_bytes = match general_purpose::STANDARD.decode(signature_b64_bytes) {
        Ok(bytes) => bytes,
        Err(_) => return -2,
    };

    let mut hasher = Sha256::new();
    hasher.update(&payload_bytes);
    let hashed_payload = hasher.finalize();

    let scheme = Pkcs1v15Sign::new::<Sha256>();
    match public_key.verify(scheme, &hashed_payload, &signature_bytes) {
        Ok(_) => 1,
        Err(_) => 2,
    }
}