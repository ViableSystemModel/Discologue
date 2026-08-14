use spacetimedb::{Identity, ReducerContext, SpacetimeType, Table, Timestamp, ViewContext, reducer, table, view};

#[table(accessor = user)]
pub struct User {
    #[primary_key]
    #[auto_inc]
    user_id: u64,

    registered_at: Timestamp,

    #[unique]
    auth_subject: String,
}

#[table(
    accessor = user_identity,
    index(
        accessor = by_user_id_and_identity,
        btree(columns = [user_id, identity])
    )
)]
pub struct UserIdentity {
    #[index(btree)]
    user_id: u64,

    #[unique]
    identity: Identity,

    created_at: Timestamp,
}

#[derive(SpacetimeType)]
pub struct UserEditEvent {
    by: u64,
    at: Timestamp,
}

#[table(accessor = game)]
pub struct Game {
    #[primary_key]
    #[auto_inc]
    game_id: u64,

    name: String,

    #[index(btree)]
    owner: u64,

    created: UserEditEvent,

    updated: Option<UserEditEvent>,

    deleted: Option<UserEditEvent>,
}

#[derive(SpacetimeType, PartialEq, Eq)]
pub enum GameAccessType {
    Read,  // just read
    Write,  // just read and write
    Revoked,
}

#[table(
    accessor = game_access,
    index(
        accessor = by_game_id_and_user_id,
        btree(columns = [game_id, user_id])
    ),
)]
pub struct GameAccess {
    #[primary_key]
    #[auto_inc]
    game_access_id: u64,

    #[index(btree)]
    game_id: u64,

    #[index(btree)]
    user_id: u64,

    type_: GameAccessType,

    created: UserEditEvent,

    updated: Option<UserEditEvent>,
}

#[table(accessor = conversation)]
pub struct Conversation {
    #[primary_key]
    #[auto_inc]
    conversation_id: u64,

    #[index(btree)]
    game_id: u64,

    name: String,

    #[unique]
    entry_point: Option<u64>,

    created: UserEditEvent,

    updated: Option<UserEditEvent>,

    deleted: Option<UserEditEvent>,
}

#[table(accessor = passage)]
pub struct Passage {
    #[primary_key]
    #[auto_inc]
    passage_id: u64,

    #[index(btree)]
    conversation_id: u64,

    name: String,

    content: String,

    created: UserEditEvent,

    updated: Option<UserEditEvent>,

    deleted: Option<UserEditEvent>,
}

#[table(accessor = passage_option)]
pub struct PassageOption {
    #[primary_key]
    #[auto_inc]
    passage_option_id: u64,

    #[index(btree)]
    passage_id: u64,

    content: String,

    repeatable: bool,

    target_passage_id: Option<u64>,

    created: UserEditEvent,

    updated: Option<UserEditEvent>,

    deleted: Option<UserEditEvent>,
}

const AUTH_ISSUER_URL: &str = env!("AUTH_ISSUER_URL");

#[reducer(client_connected)]
pub fn identity_connected(ctx: &ReducerContext) {
    let jwt_claims = match ctx.sender_auth().jwt() {
        None => return,
        Some(claims) => claims
    };

    let issuer = jwt_claims.issuer();
    let subject = jwt_claims.subject();
    if issuer != AUTH_ISSUER_URL {
        if subject.starts_with("user_") {
            log::warn!("Detected Clerk token {} with unknown issuer {}", subject, issuer);
        }
        return;
    }

    let user = ctx.db.user()
        .auth_subject()
        .find(subject.to_string())
        .unwrap_or_else(|| ctx.db.user().insert(User {
            user_id: 0,
            registered_at: ctx.timestamp,
            auth_subject: subject.to_string(),
        }));

    let identity = ctx.sender();
    ctx.db.user_identity()
        .by_user_id_and_identity()
        .filter((user.user_id, identity))
        .next()
        .unwrap_or_else(|| ctx.db.user_identity().insert(UserIdentity {
            user_id: user.user_id,
            identity: identity,
            created_at: ctx.timestamp,
        }));
}

fn get_reducer_user(ctx: &ReducerContext) -> Option<User> {
    let user_identity = match ctx.db.user_identity().identity().find(ctx.sender()) {
        None => return None,
        Some(uid) => uid,
    };

    ctx.db.user().user_id().find(user_identity.user_id)
}

fn get_view_user(ctx: &ViewContext) -> Option<User> {
    let user_identity = match ctx.db.user_identity().identity().find(ctx.sender()) {
        None => return None,
        Some(uid) => uid,
    };

    ctx.db.user().user_id().find(user_identity.user_id)
}

/** Meant to run inside of reducers so that the panic is caught and rolls back the transaction */
fn require_reducer_user(ctx: &ReducerContext) -> User {
    match get_reducer_user(ctx) {
        None => panic!("User not found for identity {}", ctx.sender()),
        Some(user) => user,
    }
}

#[reducer]
pub fn create_game(ctx: &ReducerContext, name: String) {
    let user = require_reducer_user(ctx);
    let game = ctx.db.game().insert(Game {
        game_id: 0,
        name: name,
        owner: user.user_id,
        created: UserEditEvent {
            by: user.user_id,
            at: ctx.timestamp,
        },
        updated: None,
        deleted: None,
    });
    ctx.db.game_access().insert(GameAccess {
        game_access_id: 0,
        game_id: game.game_id,
        user_id: user.user_id,
        type_: GameAccessType::Write,
        created: UserEditEvent {
            by: user.user_id,
            at: ctx.timestamp,
        },
        updated: None,
    });
}

#[view(accessor = list_owned_games, public)]
pub fn list_owned_games(ctx: &ViewContext) -> Vec<Game> {
    match get_view_user(ctx) {
        None => vec![],
        Some(user) => ctx.db.game_access().user_id().filter(user.user_id)
            .filter(|ga| ga.type_ != GameAccessType::Revoked)
            .map(|ga| ga.game_id)
            .flat_map(|id| ctx.db.game().game_id().find(id))
            .collect()

    }
}