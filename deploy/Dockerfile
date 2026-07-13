FROM nginx:1.30.3-alpine@sha256:0d3b80406a13a767339fbe2f41406d6c7da727ab89cf8fae399e81f780f814d1

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY . /usr/share/nginx/html

RUN rm -f /usr/share/nginx/html/nginx.conf /usr/share/nginx/html/Dockerfile \
    && chmod -R a+rX /usr/share/nginx/html

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
