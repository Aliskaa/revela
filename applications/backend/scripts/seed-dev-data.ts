import { randomBytes, scryptSync } from "node:crypto";

import {
  campaignParticipantsTable,
  campaignsTable,
  companiesTable,
  createDatabasePool,
  createDrizzleDb,
  inviteTokensTable,
  participantProgressTable,
  participantsTable,
  questionnaireResponsesTable,
  scoresTable,
} from "@aor/drizzle";

const hashPassword = (plainPassword: string): string => {
  const salt = randomBytes(16);
  const hash = scryptSync(plainPassword, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt1$${salt.toString("base64url")}$${hash.toString("base64url")}`;
};

async function seed() {
  const pool = createDatabasePool();
  const db = createDrizzleDb(pool);

  try {
    await db.transaction(async (tx) => {
      await tx.delete(scoresTable);
      await tx.delete(questionnaireResponsesTable);
      await tx.delete(inviteTokensTable);
      await tx.delete(participantProgressTable);
      await tx.delete(campaignParticipantsTable);
      await tx.delete(campaignsTable);
      await tx.delete(participantsTable);
      await tx.delete(companiesTable);

      const [company] = await tx
        .insert(companiesTable)
        .values({
          name: "AOR Conseil - Seed",
          contactName: "Equipe Produit",
          contactEmail: "produit@aor.local",
        })
        .returning();

      if (!company) {
        throw new Error("Echec creation entreprise seed.");
      }

      const [participantA, participantB, participantC] = await tx
        .insert(participantsTable)
        .values([
          {
            companyId: company.id,
            firstName: "Alice",
            lastName: "Martin",
            email: "alice.participant@aor.local",
            organisation: company.name,
            direction: "Operations",
            service: "Conseil",
            functionLevel: "middle_management",
            passwordHash: hashPassword("participant123"),
          },
          {
            companyId: company.id,
            firstName: "Benoit",
            lastName: "Durand",
            email: "benoit.participant@aor.local",
            organisation: company.name,
            direction: "Operations",
            service: "Delivery",
            functionLevel: "frontline_manager",
            passwordHash: hashPassword("participant123"),
          },
          {
            companyId: company.id,
            firstName: "Claire",
            lastName: "Robert",
            email: "claire.participant@aor.local",
            organisation: company.name,
            direction: "Direction",
            service: "Pilotage",
            functionLevel: "direction",
            passwordHash: null,
          },
        ])
        .returning();

      if (!participantA || !participantB || !participantC) {
        throw new Error("Echec creation participants seed.");
      }

      const [campaign] = await tx
        .insert(campaignsTable)
        .values({
          companyId: company.id,
          name: "Campagne V1 Seed Avril 2026",
          questionnaireId: "B",
          status: "active",
          allowTestWithoutManualInputs: true,
          startsAt: new Date(),
        })
        .returning();

      if (!campaign) {
        throw new Error("Echec creation campagne seed.");
      }

      await tx.insert(campaignParticipantsTable).values([
        { campaignId: campaign.id, participantId: participantA.id, invitedAt: new Date(), joinedAt: new Date() },
        { campaignId: campaign.id, participantId: participantB.id, invitedAt: new Date(), joinedAt: new Date() },
        { campaignId: campaign.id, participantId: participantC.id, invitedAt: new Date() },
      ]);

      await tx.insert(participantProgressTable).values([
        {
          campaignId: campaign.id,
          participantId: participantA.id,
          selfRatingStatus: "completed",
          peerFeedbackStatus: "pending",
          elementHumainStatus: "completed",
          resultsStatus: "locked",
          selfRatingCompletedAt: new Date(),
          elementHumainCompletedAt: new Date(),
        },
        {
          campaignId: campaign.id,
          participantId: participantB.id,
          selfRatingStatus: "pending",
          peerFeedbackStatus: "pending",
          elementHumainStatus: "pending",
          resultsStatus: "locked",
        },
        {
          campaignId: campaign.id,
          participantId: participantC.id,
          selfRatingStatus: "pending",
          peerFeedbackStatus: "locked",
          elementHumainStatus: "locked",
          resultsStatus: "locked",
        },
      ]);

      await tx.insert(inviteTokensTable).values([
        {
          token: "seed-token-alice-eh",
          participantId: participantA.id,
          campaignId: campaign.id,
          questionnaireId: "B",
          isActive: true,
        },
        {
          token: "seed-token-benoit-self",
          participantId: participantB.id,
          campaignId: campaign.id,
          questionnaireId: "B",
          isActive: true,
        },
        {
          token: "seed-token-claire-peer",
          participantId: participantC.id,
          campaignId: campaign.id,
          questionnaireId: "B",
          isActive: true,
        },
      ]);

      const [aliceEhResponse] = await tx
        .insert(questionnaireResponsesTable)
        .values({
          participantId: participantA.id,
          questionnaireId: "B",
          campaignId: campaign.id,
          submissionKind: "element_humain",
          subjectParticipantId: participantA.id,
          raterParticipantId: participantA.id,
          name: "Alice Martin",
          email: "alice.participant@aor.local",
          organisation: company.name,
        })
        .returning();

      const [aliceSelfResponse] = await tx
        .insert(questionnaireResponsesTable)
        .values({
          participantId: participantA.id,
          questionnaireId: "B",
          campaignId: campaign.id,
          submissionKind: "self_rating",
          subjectParticipantId: participantA.id,
          raterParticipantId: participantA.id,
          name: "Alice Martin",
          email: "alice.participant@aor.local",
          organisation: company.name,
        })
        .returning();

      if (!aliceEhResponse || !aliceSelfResponse) {
        throw new Error("Echec creation responses seed.");
      }

      await tx.insert(scoresTable).values([
        { responseId: aliceEhResponse.id, scoreKey: 1, value: 63 },
        { responseId: aliceEhResponse.id, scoreKey: 2, value: 47 },
        { responseId: aliceEhResponse.id, scoreKey: 3, value: 58 },
        { responseId: aliceSelfResponse.id, scoreKey: 1, value: 55 },
        { responseId: aliceSelfResponse.id, scoreKey: 2, value: 52 },
      ]);
    });

    console.log("Seed termine avec succes.");
    console.log("Participant demo actif: alice.participant@aor.local / participant123");
    console.log("Participant demo actif: benoit.participant@aor.local / participant123");
    console.log("Participant demo a activer: claire.participant@aor.local");
  } finally {
    await pool.end();
  }
}

seed().catch((error) => {
  console.error("Seed echoue:", error);
  process.exitCode = 1;
});
