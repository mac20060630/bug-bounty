import BountyProgram from '../models/BountyProgram.js';

export const createProgram = async (programData, adminId) => {
  const program = new BountyProgram({
    ...programData,
    createdBy: adminId,
  });
  await program.save();
  return program;
};

export const getPrograms = async ({ search, status, page = 1, limit = 20 }, user = null) => {
  const query = {};

  // If requester is not an admin, restrict query strictly to active programs
  if (!user || user.role !== 'admin') {
    query.status = 'active';
  } else if (status) {
    query.status = status;
  }

  // Search by companyName, title, or description
  if (search && search.trim()) {
    const term = search.trim();
    query.$or = [
      { companyName: { $regex: term, $options: 'i' } },
      { title: { $regex: term, $options: 'i' } },
      { description: { $regex: term, $options: 'i' } },
    ];
  }

  const skip = (Math.max(1, page) - 1) * limit;

  const [programs, total] = await Promise.all([
    BountyProgram.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('createdBy', 'name email'),
    BountyProgram.countDocuments(query),
  ]);

  return {
    programs,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / limit) || 1,
      limit: Number(limit),
    },
  };
};

export const getProgramById = async (id, user = null) => {
  const program = await BountyProgram.findById(id).populate('createdBy', 'name email');

  if (!program) {
    const error = new Error('Bounty program not found.');
    error.statusCode = 404;
    throw error;
  }

  // If program is not active and viewer is not admin, deny access
  if (program.status !== 'active' && (!user || user.role !== 'admin')) {
    const error = new Error('This program is currently unavailable or inactive.');
    error.statusCode = 403;
    throw error;
  }

  return program;
};

export const updateProgram = async (id, updates, adminId) => {
  const program = await BountyProgram.findById(id);

  if (!program) {
    const error = new Error('Bounty program not found.');
    error.statusCode = 404;
    throw error;
  }

  // Update fields
  const allowedFields = ['companyName', 'title', 'description', 'scope', 'rules', 'rewardRange', 'status'];
  allowedFields.forEach((field) => {
    if (updates[field] !== undefined) {
      program[field] = updates[field];
    }
  });

  await program.save();
  return program;
};

export const deleteProgram = async (id, adminId) => {
  const program = await BountyProgram.findById(id);

  if (!program) {
    const error = new Error('Bounty program not found.');
    error.statusCode = 404;
    throw error;
  }

  // Soft deactivate program by default
  program.status = 'closed';
  await program.save();

  return { message: 'Program closed and deactivated successfully', id: program._id };
};
