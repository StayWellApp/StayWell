const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} = require("@firebase/rules-unit-testing");
const fs = require("fs");

const PROJECT_ID = "demo-project";
const path = require("path");
const RULES = fs.readFileSync(path.resolve(__dirname, "../../firestore.rules"), "utf8");

describe("Firestore Rules", () => {
  let testEnv;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: RULES,
        host: "127.0.0.1",
        port: 8080,
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  it("should allow owner to read, update, and delete tasks", async () => {
    const ownerId = "owner_123";
    const taskId = "task_abc";
    const db = testEnv.authenticatedContext(ownerId).firestore();

    // Create a task (simulate existing document)
    // Note: Since creation is restricted or handled by backend, we'll use admin bypass to set up initial state
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection("tasks").doc(taskId).set({
        ownerId: ownerId,
        assignedTo: "assignee_456",
        title: "Test Task"
      });
    });

    const taskRef = db.collection("tasks").doc(taskId);

    // Read
    await assertSucceeds(taskRef.get());

    // Update
    await assertSucceeds(taskRef.update({ title: "Updated Title" }));

    // Delete
    await assertSucceeds(taskRef.delete());
  });

  it("should allow assignee to update task", async () => {
    const ownerId = "owner_123";
    const assigneeId = "assignee_456";
    const taskId = "task_abc";
    const db = testEnv.authenticatedContext(assigneeId).firestore();

    // Setup task
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection("tasks").doc(taskId).set({
        ownerId: ownerId,
        assignedTo: assigneeId,
        title: "Test Task"
      });
    });

    const taskRef = db.collection("tasks").doc(taskId);

    // Update
    await assertSucceeds(taskRef.update({ title: "Updated by Assignee" }));
  });

  it("should NOT allow assignee to delete task (VULNERABILITY REPRODUCTION)", async () => {
    const ownerId = "owner_123";
    const assigneeId = "assignee_456";
    const taskId = "task_abc";
    const db = testEnv.authenticatedContext(assigneeId).firestore();

    // Setup task
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection("tasks").doc(taskId).set({
        ownerId: ownerId,
        assignedTo: assigneeId,
        title: "Test Task"
      });
    });

    const taskRef = db.collection("tasks").doc(taskId);

    // Delete - This should fail as assignees are not allowed to delete tasks
    await assertFails(taskRef.delete());
  });

});
