const httpStatus = require("http-status").default;
const Razorpay = require("razorpay");
const { ApiError } = require("../utils/express.utils");
const { RAZOR_PAY_KEY, RAZOR_PAY_SECRET } = require("../config/dotenv.config");

// Create Razorpay Client
const razorpay = new Razorpay({
  key_id: RAZOR_PAY_KEY,
  key_secret: RAZOR_PAY_SECRET,
});

const createRPayCustomer = async ({ customerData }) => {
  try {
    const customer = await razorpay.customers.create({
      name: customerData.name,
      email: customerData.email,
      contact: customerData.phone,
      fail_existing: 0,
    });
    return customer;
  } catch (error) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "sorry_there_was_an_error_while_trying_to_create_razorpay_customer"
    );
  }
};

const updateRPayCustomer = async ({ customerId, customerData }) => {
  try {
    const customer = await razorpay.customers.edit(customerId, {
      name: customerData.name,
      email: customerData.email,
      contact: customerData.phone,
    });
    return customer;
  } catch (error) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "sorry_there_was_an_error_while_trying_to_create_razorpay_customer"
    );
  }
};

const deleteRPayCustomer = async ({ customerId }) => {
  try {
    const response = await razorpay.customers.delete(customerId);
    return response; // This should indicate the deletion success
  } catch (error) {
    throw new ApiError(
      400,
      `Error deleting customer: ${error?.error?.description}`
    );
  }
};

const createSubscriptionPlan = async ({ planData }) => {
  try {
    const plan = await razorpay.plans.create(planData);
    return plan;
  } catch (error) {
    throw new ApiError(
      400,
      `Error creating subscription plan: ${error?.error?.description}`
    );
  }
};

const createOrder = async ({ orderData }) => {
  try {
    const order = await razorpay.orders.create(orderData);
    return order;
  } catch (error) {
    console.log(error);
    throw new ApiError(
      400,
      `Error creating order: ${error?.error?.description}`
    );
  }
};

const createSubscription = async ({ subscriptionData }) => {
  try {
    const order = await razorpay.subscriptions.create(subscriptionData);
    return order;
  } catch (error) {
    console.log(error);
    throw new ApiError(
      400,
      `Error creating subscription: ${error?.error?.description}`
    );
  }
};

const getSubscriptionDetail = async ({ subscriptionId }) => {
  try {
    const response = await razorpay.subscriptions.fetch(subscriptionId);
    return response; // This should indicate the cancellation success
  } catch (error) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Error getting customer: ${error?.error?.description}`
    );
  }
};

const cancelSubscription = async ({ subscriptionId }) => {
  try {
    const response = await razorpay.subscriptions.cancel(subscriptionId);
    return response; // This should indicate the cancellation success
  } catch (error) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Error cancelling customer: ${error?.error?.description}`
    );
  }
};

const findOrCreateRPayCustomer = async (customerData, userId) => {
  try {
    // Attempt to find the customer based on their email
    const customers = await razorpay.customers.all({
      email: customerData.email,
    });

    let customer;

    if (customers.items.length > 0) {
      // If customer already exists, use the existing customer
      customer = customers.items[0];
    } else {
      // If no customer found, create a new customer
      customer = await razorpay.customers.create({
        name: customerData.name,
        email: customerData.email,
        contact: customerData.contact,
        fail_existing: 0, // Allow creation of new customer if none exists
      });
    }

    // Update the user's razorpay_customer_id in the database
    await global.models.CRUCIAL.USER.updateOne(
      { _id: userId },
      { razorpay_customer_id: customer.id }
    );

    return customer;
  } catch (error) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Error finding or creating customer: ${error?.error?.description}`
    );
  }
};

const pauseSubscription = async ({ subscriptionId }) => {
  try {
    const response = await razorpay.subscriptions.pause(subscriptionId);
    return response; // This should indicate the cancellation success
  } catch (error) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Error pause subscription: ${error?.error?.description}`
    );
  }
};

const updateSubscription = async ({ subscriptionId, subscriptionData }) => {
  try {
    const response = await razorpay.subscriptions.update(
      subscriptionId,
      subscriptionData
    );
    return response; // This should indicate the cancellation success
  } catch (error) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Error updating subscription: ${error?.error?.description}`
    );
  }
};

const resumeSubscription = async ({ subscriptionId }) => {
  try {
    const response = await razorpay.subscriptions.resume(subscriptionId);
    return response; // This should indicate the cancellation success
  } catch (error) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Error resume subscription: ${error?.error?.description}`
    );
  }
};

module.exports = {
  createRPayCustomer,
  updateRPayCustomer,
  deleteRPayCustomer,
  createSubscriptionPlan,
  createOrder,
  createSubscription,
  cancelSubscription,
  findOrCreateRPayCustomer,
  getSubscriptionDetail,
  pauseSubscription,
  resumeSubscription,
  updateSubscription,
};
