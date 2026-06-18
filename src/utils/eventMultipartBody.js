export function normalizeEventMultipartFields(body) {
  if (body.banner === "" || body.banner === "null") {
    delete body.banner;
  }

  if (body.venue === "") {
    delete body.venue;
  }

  return body;
}
