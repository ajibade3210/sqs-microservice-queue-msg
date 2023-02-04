/* eslint-disable prettier/prettier */
/* eslint-disable no-return-await */
const axios = require("axios");
const sequelize = require("../../database/PostgresDb");
const UserOutlet = require("../../models/org/UserOutlet");
const User = require("../../models/User");
const queueMessages = require("../helpers/sqs/sendSQS");
const Auth = require("./Auth");
const Permission = require("./Permission");
const { updateUserAppRole } = require("./Role");
const { allocateUser } = require("./subscriptionService");

const baseURL = `${process.env.CLOUDENLY_PAYMENTS_URL}/payments/v1`;

exports.verifyPayment = async paymentReference => {
  try {
    const url = `${baseURL}/collections/transactions/verify/${paymentReference}`;
    console.log(url);
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message);
  }
};

exports.attemptPayment = async payload => {
  try {
    const url = `${baseURL}/cards/transactions/charge`;
    console.log(url);
    const response = await axios.post(url, payload);
    return response.data;
  } catch (error) {
    const err = error.response.data;
    if (err) {
      return err;
    }
    throw new Error(JSON.stringify(error));
  }
};

exports.getAllCards = async orgId => {
  const url = `${baseURL}/cards/list/${orgId}`;
  // http://18.132.188.41:9000
  console.log(url);
  const response = await axios.get(url);
  return response.data;
};

exports.createUserFromQueue = async emp => {
  await sequelize.transaction(async t => {
    try {
      // some user attributes to be created
      const { orgId, role, isEmployee, permission, canLogin, creator } = emp;

      // Add user to subscription
      if (isEmployee === true) {
        await allocateUser({ orgId, appSlug: "humanar", transaction: t });
      }

      // Account credentials exists if user is an employee or has a role
      const hasAccount = !!(
        (isEmployee === true && canLogin === true) ||
        (role && role.roleId)
        );

        const userDetail = emp;
        userDetail.fname = emp.firstName || emp.fname;
        userDetail.lname = emp.lastName || emp.lname;
        userDetail.hasAccount = hasAccount;

        const user = await User.create(userDetail, {
          include: [{ model: UserOutlet, as: "userOutlets" }],
          transaction: t
        });

      // update susbscription mode, allocated user,
      if (role && role.roleId) {
        await updateUserAppRole({
          name: user.fname,
          email: user.email,
          userId: user.id,
          orgId: user.orgId,
          appSlug: role.appSlug,
          roleId: role.roleId,
          transaction: t
        });
      }

      if (hasAccount) {
        // Add login credentials to users
        await Auth.createCredentials(user, t);
      }

      if (permission) {
        await Permission.save({ userId: user.id, orgId, ...permission }, t);
      }

      const userInfo = [
        {
          userId: user.id,
          orgId: user.orgId,
          fname: user.fname,
          lname: user.lname,
          mname: user.mname,
          email: user.email,
          phoneNo: user.phoneNo,
          functionId: user.functionId,
          reportingTo: user.reportingTo,
          designation: user.designation,
          officeAddress: user.officeAddress,
          level: user.level,
          creator
        },
      ];
      queueMessages(userInfo);
      return 201;
    } catch (error) {
      t.rollback();
      return error;
    }
  });
};
