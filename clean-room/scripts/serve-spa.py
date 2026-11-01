"""Minimal SPA-fallback static server for rendered verification sweeps.

Serves a built artifact directory and falls back to index.html for client-side
routes, matching the production rewrite contract. Development-only tooling.
"""
import http.server
import os
import socketserver
import sys

PORT = int(sys.argv[1])
DIRECTORY = sys.argv[2]


class SpaHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        target = self.translate_path(self.path)
        if not os.path.exists(target) or os.path.isdir(target):
            self.path = "/index.html"
        return super().do_GET()

    def do_HEAD(self):
        target = self.translate_path(self.path)
        if not os.path.exists(target) or os.path.isdir(target):
            self.path = "/index.html"
        return super().do_HEAD()

    def log_message(self, *args):
        pass


socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("127.0.0.1", PORT), SpaHandler) as server:
    server.serve_forever()
