function fieldValue(elements, index) {
  return elements[index]?.value?.trim() || "";
}

export function extractFormPayload(form, pageSlug) {
  const fields = [...form.querySelectorAll("input, textarea, select")].filter(
    (field) => !["checkbox", "radio", "submit"].includes(field.type)
  );
  const className = form.className || "";

  if (className.includes("newsletter-form")) {
    return { endpoint: "/forms/newsletter", payload: { email: fieldValue(fields, 0) } };
  }

  if (className.includes("form-wrapper") && pageSlug === "login") {
    return {
      endpoint: "/auth/login",
      payload: { email: fieldValue(fields, 0), password: fieldValue(fields, 1) }
    };
  }

  if (className.includes("form-wrapper") && pageSlug === "register") {
    return {
      endpoint: "/auth/register",
      payload: {
        name: fieldValue(fields, 0),
        email: fieldValue(fields, 1),
        password: fieldValue(fields, 2)
      }
    };
  }

  if (className.includes("booking-form")) {
    return {
      endpoint: "/forms/service-request",
      payload: {
        name: fieldValue(fields, 0),
        email: fieldValue(fields, 1),
        phone: fieldValue(fields, 2),
        service: fieldValue(fields, 3),
        preferredDate: fieldValue(fields, 4) || undefined,
        message: fieldValue(fields, 5)
      }
    };
  }

  if (className.includes("comment-form") && pageSlug === "contact") {
    return {
      endpoint: "/forms/contact",
      payload: {
        name: fieldValue(fields, 0),
        email: fieldValue(fields, 1),
        phone: fieldValue(fields, 2),
        subject: fieldValue(fields, 3),
        message: fieldValue(fields, 4)
      }
    };
  }

  return null;
}
