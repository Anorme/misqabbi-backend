/*eslint-disable no-undef */
import { normalizeEventMultipartFields } from "../../../src/utils/eventMultipartBody.js";

function normalize(body) {
  return normalizeEventMultipartFields({ ...body });
}

describe("event multipart normalization", () => {
  it("strips empty optional banner and venue placeholders", () => {
    const body = normalize({
      banner: "",
      venue: "",
      name: "Summer Pop-up",
    });

    expect(body).toEqual({ name: "Summer Pop-up" });
  });

  it("strips null string banner placeholders", () => {
    const body = normalize({
      banner: "null",
      name: "Summer Pop-up",
    });

    expect(body).toEqual({ name: "Summer Pop-up" });
  });

  it("preserves attached banner objects", () => {
    const banner = {
      url: "https://res.cloudinary.com/demo/image/upload/v1/event/banner",
      publicId: "misqabbi/events/banner",
    };
    const body = normalize({
      banner,
      venue: { name: "Studio" },
    });

    expect(body.banner).toEqual(banner);
    expect(body.venue).toEqual({ name: "Studio" });
  });
});
