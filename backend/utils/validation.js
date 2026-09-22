const mongoose = require("mongoose");

const isValidObjectId = (value) =>
  typeof value === "string" && mongoose.Types.ObjectId.isValid(value);

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const isTime = (value) =>
  typeof value === "string" &&
  /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);

const validateSlotInput = ({ date, startTime, endTime }, { allowPast = false } = {}) => {
  const errors = [];

  if (!isNonEmptyString(date)) {
    errors.push("Date is required");
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    errors.push("Date must be in YYYY-MM-DD format");
  } else {
    const parsedDate = new Date(`${date}T00:00:00.000Z`);
    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== date
    ) {
      errors.push("Date must be a valid calendar date");
    }
  }

  if (!isTime(startTime)) {
    errors.push("startTime must be in HH:mm format");
  }

  if (!isTime(endTime)) {
    errors.push("endTime must be in HH:mm format");
  }

  if (isTime(startTime) && isTime(endTime) && startTime >= endTime) {
    errors.push("endTime must be after startTime");
  }

  if (
    !allowPast &&
    errors.length === 0 &&
    new Date(`${date}T${startTime}:00.000Z`) < new Date()
  ) {
    errors.push("Slot date and time cannot be in the past");
  }

  return errors;
};

const timeToMinutes = (value) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

module.exports = {
  isValidObjectId,
  isNonEmptyString,
  isTime,
  validateSlotInput,
  timeToMinutes,
};
