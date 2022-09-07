use axum::{
    http::{StatusCode, header},
    response::{IntoResponse, Html},
    routing::{get, post},
    Router, extract::Path,
};
use std::net::SocketAddr;

#[tokio::main]
async fn main() {

    // build our application with a route
    let app = Router::new()
        // `GET /` goes to `root`
        .route("/", get(root))
        .route("/index.js", get(js))
        .route("/style.css", get(css))
        .route("/audio/:uuid", get(download))
        // `POST /users` goes to `create_user`
        .route("/create", post(create));

    // run our app with hyper
    // `axum::Server` is a re-export of `hyper::Server`
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}

// basic handler that responds with a static string
async fn root() -> Html<String> {
    Html(tokio::fs::read_to_string("./ui.html").await.unwrap())
}

async fn js() -> impl IntoResponse {
    (
        [
            (header::CONTENT_TYPE, "text/javascript"),
        ],
        tokio::fs::read_to_string("./index.js").await.unwrap()
    )
}

async fn css() -> impl IntoResponse {
    (
        [
            (header::CONTENT_TYPE, "text/css"),
        ],
        tokio::fs::read_to_string("./style.css").await.unwrap()
    )
}

async fn download(Path(uuid): Path<String>) -> impl IntoResponse {
    let data = tokio::fs::read(format!("./data/{uuid}")).await.unwrap();

    data
}

async fn create(mut multipart: axum::extract::Multipart) -> impl IntoResponse {
    let id = uuid::Uuid::new_v4();

    let body = multipart.next_field().await.unwrap().unwrap().bytes().await.unwrap();

    tokio::fs::write(format!("./data/{id}"), body).await.unwrap();
    (StatusCode::CREATED, id.to_string())
}

