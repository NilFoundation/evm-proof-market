# Test environment for nodejs
FROM node:18.15

WORKDIR /home

ENV DEBIAN_FRONTEND=noninteractive

ARG USER_ID
ARG GROUP_ID

RUN if getent passwd $USER_ID ; then echo "User exists" ; else useradd -u $USER_ID -g $GROUP_ID -m user123 ; fi
RUN chown -R $USER_ID:$GROUP_ID /home

USER $USER_ID
