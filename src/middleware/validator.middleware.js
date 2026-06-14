import { userValidator } from "../validators/user.validator.js";
import { productValidator } from "../validators/product.validator.js";
import { variantProductValidator } from "../validators/variant.validator.js";
import { orderValidator } from "../validators/order.validator.js";
import { newsletterValidator } from "../validators/newsletter.validator.js";
import { contactValidator } from "../validators/contact.validator.js";
import { bespokeValidator } from "../validators/bespoke.validator.js";
import { formSchemaValidator } from "../validators/formSchema.validator.js";
import {
  eventStatusValidator,
  eventTicketTypeValidator,
  eventValidator,
} from "../validators/event.validator.js";
import { volunteerApplicationStatusValidator } from "../validators/volunteerApplication.validator.js";
import { formatResponse } from "../utils/responseFormatter.js";

export function validateUser(req, res, next) {
  const { error } = userValidator.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      errors: error.details.map(err => err.message),
    });
  }
  next();
}

export function validateProduct(req, res, next) {
  // For updates (PUT/PATCH), make required fields optional to allow partial updates
  const isUpdate = req.method === "PUT" || req.method === "PATCH";

  const schema = isUpdate
    ? productValidator.fork(["name", "price", "category", "stock"], schema =>
        schema.optional()
      )
    : productValidator;

  const { error } = schema.validate(req.body, {
    abortEarly: false,
    allowUnknown: true, // Allow fields not in schema (like images from middleware)
  });

  if (error) {
    return res.status(400).json({
      errors: error.details.map(err => err.message),
    });
  }
  next();
}

export function validateVariantProduct(req, res, next) {
  const { error } = variantProductValidator.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    return res.status(400).json({
      errors: error.details.map(err => err.message),
    });
  }
  next();
}

export function validateOrder(req, res, next) {
  const { error } = orderValidator.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      errors: error.details.map(err => err.message),
    });
  }
  next();
}

export function validateNewsletter(req, res, next) {
  const { error } = newsletterValidator.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    return res.status(400).json({
      errors: error.details.map(err => err.message),
    });
  }
  next();
}

export function validateContact(req, res, next) {
  const { error } = contactValidator.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    return res.status(400).json({
      errors: error.details.map(err => err.message),
    });
  }
  next();
}

export function validateBespoke(req, res, next) {
  const { error } = bespokeValidator.validate(req.body, {
    abortEarly: false,
    allowUnknown: true,
  });
  if (error) {
    const message = error.details[0]?.message ?? "Validation failed";
    return res.status(400).json(formatResponse({ success: false, message }));
  }
  next();
}

export function validateEvent(req, res, next) {
  const isUpdate = req.method === "PATCH" || req.method === "PUT";
  const schema = isUpdate
    ? eventValidator.fork(
        ["name", "description", "eventDate", "type", "maxAttendees"],
        fieldSchema => fieldSchema.optional()
      )
    : eventValidator;

  const { error } = schema.validate(req.body, {
    abortEarly: false,
    allowUnknown: true,
  });

  if (error) {
    return res.status(400).json(
      formatResponse({
        success: false,
        errors: error.details.map(err => err.message),
      })
    );
  }

  next();
}

export function validateEventStatus(req, res, next) {
  const { error } = eventStatusValidator.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json(
      formatResponse({
        success: false,
        errors: error.details.map(err => err.message),
      })
    );
  }

  next();
}

export function validateEventTicketType(req, res, next) {
  const isUpdate = req.method === "PATCH" || req.method === "PUT";
  const schema = isUpdate
    ? eventTicketTypeValidator.fork(
        ["name", "pricePesewas", "maxQuantity"],
        fieldSchema => fieldSchema.optional()
      )
    : eventTicketTypeValidator;

  const { error } = schema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json(
      formatResponse({
        success: false,
        errors: error.details.map(err => err.message),
      })
    );
  }

  next();
}

export function validateFormSchema(req, res, next) {
  const { error } = formSchemaValidator.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json(
      formatResponse({
        success: false,
        errors: error.details.map(err => err.message),
      })
    );
  }

  next();
}

export function validateVolunteerApplicationStatus(req, res, next) {
  const { error } = volunteerApplicationStatusValidator.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json(
      formatResponse({
        success: false,
        errors: error.details.map(err => err.message),
      })
    );
  }

  next();
}
