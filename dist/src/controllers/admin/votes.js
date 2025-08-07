"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteOption = exports.createOption = exports.updateOption = exports.getOption = exports.getAllOptions = exports.deleteVote = exports.updateVote = exports.createVote = exports.getVote = exports.getAllVotes = void 0;
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
                        .update(schema_1.votesItems)
                        .set({
                        voteId: voteId,
                    })
                        .where((0, drizzle_orm_1.eq)(schema_1.votesItems.id, item));
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
    const { name, maxSelections, items, startDate, endDate } = req.body;
    await db_1.db.transaction(async (tx) => {
        // Update vote
        await tx
            .update(schema_1.votes)
            .set({
            name,
            maxSelections,
            startDate: new Date(new Date(startDate).getTime() + 3 * 60 * 60 * 1000),
            endDate: new Date(new Date(endDate).getTime() + 3 * 60 * 60 * 1000),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.votes.id, id));
        // Handle vote items
        if (items && Array.isArray(items)) {
            for (const item of items) {
                if (typeof item === "string") {
                    // Only an ID provided → delete item
                    await tx
                        .update(schema_1.votesItems)
                        .set({ voteId: null })
                        .where((0, drizzle_orm_1.eq)(schema_1.votesItems.id, item));
                }
                else if (item.id && item.value) {
                    // Update existing item
                    await tx
                        .update(schema_1.votesItems)
                        .set({ voteId: id })
                        .where((0, drizzle_orm_1.eq)(schema_1.votesItems.id, item.id));
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
const getAllOptions = async (req, res) => {
    const options = await db_1.db.select().from(schema_1.votesItems);
    if (!options.length) {
        throw new Errors_1.NotFound("No options found");
    }
    (0, response_1.SuccessResponse)(res, { options }, 200);
};
exports.getAllOptions = getAllOptions;
const getOption = async (req, res) => {
    const { id } = req.params;
    const option = await db_1.db.query.votesItems.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.votesItems.id, id),
    });
    if (!option)
        throw new Errors_1.NotFound("Option not found");
    (0, response_1.SuccessResponse)(res, { option }, 200);
};
exports.getOption = getOption;
const updateOption = async (req, res) => {
    const { item } = req.body;
    const id = req.params.id;
    const [itemV] = await db_1.db
        .select()
        .from(schema_1.votesItems)
        .where((0, drizzle_orm_1.eq)(schema_1.votesItems.id, id));
    if (!itemV)
        throw new Errors_1.NotFound("option not found");
    await db_1.db.update(schema_1.votesItems).set({ item }).where((0, drizzle_orm_1.eq)(schema_1.votesItems.id, id));
    (0, response_1.SuccessResponse)(res, { message: "Option Updated Successfully" }, 200);
};
exports.updateOption = updateOption;
const createOption = async (req, res) => {
    const { item } = req.body;
    const id = (0, uuid_1.v4)();
    await db_1.db.insert(schema_1.votesItems).values({ id, item });
    (0, response_1.SuccessResponse)(res, { message: "Option Updated Successfully" }, 200);
};
exports.createOption = createOption;
const deleteOption = async (req, res) => {
    const { id } = req.params;
    const option = await db_1.db.query.votesItems.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.votesItems.id, id),
    });
    if (!option)
        throw new Errors_1.NotFound("Option not found");
    await db_1.db.delete(schema_1.votesItems).where((0, drizzle_orm_1.eq)(schema_1.votesItems.id, id));
    (0, response_1.SuccessResponse)(res, { message: "option deleted" }, 200);
};
exports.deleteOption = deleteOption;
