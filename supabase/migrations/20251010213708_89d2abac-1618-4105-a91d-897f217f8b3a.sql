-- Fix: missing cryptographic functions used by audit and PII utilities
-- Enables digest(), crypt(), gen_salt(), pgp_sym_encrypt()/pgp_sym_decrypt()
CREATE EXTENSION IF NOT EXISTS pgcrypto;