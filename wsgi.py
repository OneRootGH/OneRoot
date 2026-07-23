import os

from oneroot_erp import create_app

app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "8124")), debug=True)
