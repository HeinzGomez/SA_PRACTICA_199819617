#!/usr/bin/env sh
# HeinzGomez - Práctica 7: genera los stubs Python desde proto/certificados.proto
set -e
PROTO_DIR="${PROTO_DIR:-../../proto}"
python -m grpc_tools.protoc -I"$PROTO_DIR" --python_out=app/gen --grpc_python_out=app/gen "$PROTO_DIR/certificados.proto"
