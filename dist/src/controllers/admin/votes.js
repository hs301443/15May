"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVote = exports.updateVote = exports.createVote = exports.getVote = exports.getAllVotes = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const response_1 = require("../../utils/response");
const uuid_1 = require("uuid");
const drizzle_orm_1 = require("drizzle-orm");
const Errors_1 = require("../../Errors");
const drizzle_orm_2 = require("drizzle-orm");
const getAllVotes = async (req, res) => {
    const data = await db_1.db
        .select()
        .from(schema_1.votes)
        .leftJoin(schema_1.votesItems, (0, drizzle_orm_1.eq)(schema_1.votes.id, schema_1.votesItems.voteId))
        .orderBy(schema_1.votes.createdAt);
    const grouped = {};
    for (const row of data) {
        const vote = row.votes;
        const item = row.votes_items;
        if (!grouped[vote.id]) {
            grouped[vote.id] = {
                id: vote.id,
                name: vote.name,
                maxSelections: vote.maxSelections,
                startDate: vote.startDate
                    ? new Date(vote.startDate).toISOString().substring(0, 10)
                    : null,
                endDate: vote.endDate
                    ? new Date(vote.endDate).toISOString().substring(0, 10)
                    : null,
                createdAt: vote.createdAt
                    ? new Date(vote.createdAt).toISOString().substring(0, 10)
                    : null,
                options: [],
                votesCount: 0,
            };
        }
        if (item) {
            grouped[vote.id].options.push({
                id: item.id,
                text: item.item,
            });
            const [{ votesCount }] = await db_1.db
                .select({ votesCount: (0, drizzle_orm_2.sql) `COUNT(*)` })
                .from(schema_1.userVotes)
                .where((0, drizzle_orm_1.eq)(schema_1.userVotes.voteId, vote.id));
            grouped[vote.id].votesCount = votesCount;
        }
    }
    const result = Object.values(grouped);
    (0, response_1.SuccessResponse)(res, { votes: result }, 200);
};
exports.getAllVotes = getAllVotes;
const getVote = async (req, res) => {
    const id = req.params.id;
    const vote = await db_1.db.query.votes.findFirst({ where: (0, drizzle_orm_1.eq)(schema_1.votes.id, id) });
    if (!vote) {
        throw new Errors_1.NotFound("Vote not found");
    }
    const options = await db_1.db
        .select()
        .from(schema_1.votesItems)
        .where((0, drizzle_orm_1.eq)(schema_1.votesItems.voteId, id));
    const formatVote = {
        ...vote,
        startDate: new Date(vote.startDate).toISOString().substring(0, 10),
        endDate: new Date(vote.endDate).toISOString().substring(0, 10),
        createdAt: new Date(vote.createdAt).toISOString().substring(0, 10),
    };
    (0, response_1.SuccessResponse)(res, { vote: { ...formatVote, options } }, 200);
};
exports.getVote = getVote;
const createVote = async (req, res) => {
    const { name, maxSelections, items, startDate, endDate } = req.body;
    const voteId = (0, uuid_1.v4)();
    await db_1.db.transaction(async (tx) => {
        await tx.insert(schema_1.votes).values({
            id: voteId,
            name,
            maxSelections,
            startDate: new Date(new Date(startDate).getTime() + 3 * 60 * 60 * 1000), // Adjusting for timezone
            endDate: new Date(new Date(endDate).getTime() + 3 * 60 * 60 * 1000), // Adjusting for timezone
            createdAt: new Date(new Date().getTime() + 3 * 60 * 60 * 1000), // Adjusting for timezone
        });
        if (items) {
            if (items.length) {
                items.forEach(async (item) => {
                    await tx
                        .insert(schema_1.votesItems)
                        .values({
                        voteId: voteId,
                        item: item,
                        id: item.id || (0, uuid_1.v4)(),
                    });
                });
            }
        }
    });
    (0, response_1.SuccessResponse)(res, { message: "vote created successfully" }, 201);
};
exports.createVote = createVote;
const updateVote = async (req, res) => {
    const id = req.params.id;
    const vote = await db_1.db.query.votes.findFirst({ where: (0, drizzle_orm_1.eq)(schema_1.votes.id, id) });
    if (!vote)
        throw new Errors_1.NotFound("Vote not found");
    const { name, maxSelection, maxSelections, items, startDate, endDate } = req.body;
    await db_1.db.transaction(async (tx) => {
        // Prepare update object
        const updateData = {};
        // Update name if provided
        if (name !== undefined) {
            updateData.name = name;
        }
        // Handle maxSelections (accepts both names)
        if (maxSelection !== undefined || maxSelections !== undefined) {
            updateData.maxSelections = maxSelection ?? maxSelections;
        }
        // Handle dates if provided
        if (startDate) {
            updateData.startDate = new Date(new Date(startDate).getTime() + 3 * 60 * 60 * 1000);
        }
        if (endDate) {
            updateData.endDate = new Date(new Date(endDate).getTime() + 3 * 60 * 60 * 1000);
        }
        // Update vote main data
        if (Object.keys(updateData).length > 0) {
            await tx.update(schema_1.votes).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.votes.id, id));
        }
        // Handle vote items
        if (items && Array.isArray(items)) {
            for (const item of items) {
                if (typeof item === "string") {
                    // Remove item from vote (unlink)
                    await tx.update(schema_1.votesItems)
                        .set({ voteId: null })
                        .where((0, drizzle_orm_1.eq)(schema_1.votesItems.id, item));
                }
                else if (item.id) {
                    // Update existing item
                    await tx.update(schema_1.votesItems)
                        .set({
                        voteId: id,
                        item: item.item ?? item.value ?? item.name ?? "",
                    })
                        .where((0, drizzle_orm_1.eq)(schema_1.votesItems.id, item.id));
                }
                else {
                    // Insert new item
                    await tx.insert(schema_1.votesItems).values({
                        voteId: id,
                        item: item.item ?? item.value ?? item.name ?? "",
                        id: (0, uuid_1.v4)(),
                    });
                }
            }
        }
    });
    (0, response_1.SuccessResponse)(res, { message: "Vote updated successfully" }, 200);
};
exports.updateVote = updateVote;
const deleteVote = async (req, res) => {
    const id = req.params.id;
    const vote = await db_1.db.query.votes.findFirst({ where: (0, drizzle_orm_1.eq)(schema_1.votes.id, id) });
    if (!vote)
        throw new Errors_1.NotFound("Vote not found");
    await db_1.db.transaction(async (tx) => {
        await tx
            .update(schema_1.votesItems)
            .set({ voteId: null })
            .where((0, drizzle_orm_1.eq)(schema_1.votesItems.voteId, id));
        const userVotesList = await tx
            .select({ id: schema_1.userVotes.id })
            .from(schema_1.userVotes)
            .where((0, drizzle_orm_1.eq)(schema_1.userVotes.voteId, id));
        const userVoteIds = userVotesList.map((uv) => uv.id);
        if (userVoteIds.length > 0) {
            await tx
                .delete(schema_1.userVotesItems)
                .where((0, drizzle_orm_1.inArray)(schema_1.userVotesItems.userVoteId, userVoteIds));
            await tx.delete(schema_1.userVotes).where((0, drizzle_orm_1.eq)(schema_1.userVotes.voteId, id));
        }
        await tx.delete(schema_1.votes).where((0, drizzle_orm_1.eq)(schema_1.votes.id, id));
    });
    (0, response_1.SuccessResponse)(res, { message: "vote deleted successfully" }, 200);
};
exports.deleteVote = deleteVote;
//options
// export const getAllOptions = async (req: Request, res: Response) => {
//   const options = await db.select().from(votesItems);
//   if (!options.length) {
//     throw new NotFound("No options found");
//   }
//   SuccessResponse(res, { options }, 200);
// };
// export const getOption = async (req: Request, res: Response) => {
//   const { id } = req.params;
//   const option = await db.query.votesItems.findFirst({
//     where: eq(votesItems.id, id),
//   });
//   if (!option) throw new NotFound("Option not found");
//   SuccessResponse(res, { option }, 200);
// };
// export const updateOption = async (req: Request, res: Response) => {
//   const { item } = req.body;
//   const id = req.params.id;
//   const [itemV] = await db
//     .select()
//     .from(votesItems)
//     .where(eq(votesItems.id, id));
//   if (!itemV) throw new NotFound("option not found");
//   await db.update(votesItems).set({ item }).where(eq(votesItems.id, id));
//   SuccessResponse(res, { message: "Option Updated Successfully" }, 200);
// };
// export const createOption = async (req: Request, res: Response) => {
//   const { item } = req.body;
//   const id = uuidv4();
//   await db.insert(votesItems).values({ id, item });
//   SuccessResponse(res, { message: "Option Updated Successfully" }, 200);
// };
// export const deleteOption = async (req: Request, res: Response) => {
//   const { id } = req.params;
//   const option = await db.query.votesItems.findFirst({
//     where: eq(votesItems.id, id),
//   });
//   if (!option) throw new NotFound("Option not found");
//   await db.delete(votesItems).where(eq(votesItems.id, id));
//   SuccessResponse(res, { message: "option deleted" }, 200);
// };
