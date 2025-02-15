const Agenda = require("agenda");
const {
  getTenantConnection,
  tenentConnectionMap,
} = require("../connections/mongodb.connection");
const logger = require("../logger/logger");
const { DB_HOST, DB_PORT, DB_NAME } = require("../config/dotenv.config");

const agendaInstances = new Map();

// define task for tenets
const defineAgendaJobs = (agenda, tenantId) => {
  agenda.define("send daily email", async (job) => {
    logger.info(`📧 Sending Daily Email for Tenant: ${tenantId}`);
  });
};

const initTenantAgenda = async (tenantId) => {
  if (agendaInstances.has(tenantId)) {
    return agendaInstances.get(tenantId);
  }

  const tenantDb = await getTenantConnection(tenantId);
  const agenda = new Agenda({
    db: {
      address: tenantDb.client.s.url,
      collection: "agendaJobs",
    },
  });

  defineAgendaJobs(agenda, tenantId);
  await agenda.start();
  await agenda.every("1 day", "send daily email"); // Run daily

  agendaInstances.set(tenantId, agenda);
  logger.info(`🚀 Agenda initialized for tenant: ${tenantId}`);
};

const initAllTenantAgendas = async () => {
  for (const tenantId of tenentConnectionMap.keys()) {
    await initTenantAgenda(tenantId);
  }
  logger.info("✅ All tenant agenda instances initialized!");
};

// For Main Server
const agenda = new Agenda({
  db: {
    address: `mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`,
    collection: "agendaJobs",
  },
});

// define task for main
agenda.define("send daily email", async (job) => {
  logger.info("Agenda Start...");
});

const initAgenda = async () => {
  await agenda.start();
  // Run the job immediately
  // await agenda.every("1 minutes", "send daily email", {
  //   test: "1",
  //   isfalse: false,
  // });
  logger.info("🚀 Agenda jobs scheduled!");

  await initAllTenantAgendas();
};

module.exports = initAgenda;

//  await agenda.now("send daily email");

// Run the job every 5 minutes
// await agenda.every("5 minutes", "send daily email");

// Schedule a job to run once in 10 minutes
// await agenda.schedule("in 10 minutes", "send daily email");

// Run every hour
// await agenda.repeatEvery("1 hour", "send daily email");

// Run every day at 8 AM using a cron expression
// await agenda.every("0 8 * * *", "send daily email");
