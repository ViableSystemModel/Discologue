use std::env;
use url::Url;

fn main() {
    println!("cargo:rerun-if-env-changed=AUTH_ISSUER_URL");

    let issuer = env::var("AUTH_ISSUER_URL")
        .expect("AUTH_ISSUER_URL must be set");

    let url = Url::parse(&issuer)
        .expect("AUTH_ISSUER_URL must be a valid URL");

    assert_eq!(
        url.scheme(),
        "https",
        "AUTH_ISSUER_URL must use HTTPS"
    );

    assert!(
        url.query().is_none() && url.fragment().is_none(),
        "AUTH_ISSUER_URL must not contain a query or fragment"
    );

    println!("cargo:rustc-env=AUTH_ISSUER_URL={issuer}");
}