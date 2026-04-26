from flask import Flask

from app.account_routes import account_bp
from app.auth_routes import auth_bp
from app.config import Config
from app.extensions import cors, db, migrate
from app.routes import main_bp
from app.transaction_routes import transaction_bp


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(
        app,
        supports_credentials=True,
        resources={r"/api/*": {"origins": app.config["FRONTEND_ORIGINS"]}},
    )

    from app import models  # noqa: F401

    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(account_bp)
    app.register_blueprint(transaction_bp)

    return app
