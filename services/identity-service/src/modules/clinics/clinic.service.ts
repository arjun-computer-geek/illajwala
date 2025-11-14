import type { FilterQuery } from "mongoose";
import { ClinicModel, type ClinicDocument } from "./clinic.model";
import type { CreateClinicInput, UpdateClinicInput, ListClinicQuery } from "./clinic.schema";

type PaginationOptions = {
  page?: number;
  pageSize?: number;
};

const buildPagination = ({ page = 1, pageSize = 20 }: PaginationOptions) => {
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, Math.min(pageSize, 100));
  return { page: safePage, pageSize: safePageSize, skip: (safePage - 1) * safePageSize, limit: safePageSize };
};

export const createClinic = async (tenantId: string, payload: CreateClinicInput) => {
  const doc = await ClinicModel.create({
    tenantId,
    name: payload.name,
    slug: payload.slug,
    timezone: payload.timezone ?? "Asia/Kolkata",
    address: payload.address,
    city: payload.city,
    phone: payload.phone,
    email: payload.email,
    capacity: payload.capacity,
    waitlistOverrides: payload.waitlistOverrides,
    metadata: payload.metadata,
  });
  return doc;
};

export const updateClinic = async (tenantId: string, id: string, payload: UpdateClinicInput) =>
  ClinicModel.findOneAndUpdate(
    { _id: id, tenantId },
    {
      ...(payload.name ? { name: payload.name } : {}),
      ...(payload.slug ? { slug: payload.slug } : {}),
      ...(payload.timezone ? { timezone: payload.timezone } : {}),
      ...(payload.address !== undefined ? { address: payload.address } : {}),
      ...(payload.city !== undefined ? { city: payload.city } : {}),
      ...(payload.phone !== undefined ? { phone: payload.phone } : {}),
      ...(payload.email !== undefined ? { email: payload.email } : {}),
      ...(payload.capacity ? { capacity: payload.capacity } : {}),
      ...(payload.waitlistOverrides ? { waitlistOverrides: payload.waitlistOverrides } : {}),
      ...(payload.metadata ? { metadata: payload.metadata } : {}),
    },
    { new: true, runValidators: true }
  );

export const listClinics = async (
  tenantId: string,
  { city, search, page, pageSize }: ListClinicQuery
): Promise<{ items: ClinicDocument[]; total: number }> => {
  const filter: FilterQuery<ClinicDocument> = { tenantId };
  if (city) {
    filter.city = city;
  }
  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [{ name: regex }, { slug: regex }, { city: regex }];
  }

  const paginationInput: PaginationOptions = {};
  if (page !== undefined) {
    paginationInput.page = page;
  }
  if (pageSize !== undefined) {
    paginationInput.pageSize = pageSize;
  }

  const { skip, limit } = buildPagination(paginationInput);
  const [items, total] = await Promise.all([
    ClinicModel.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
    ClinicModel.countDocuments(filter),
  ]);
  return { items, total };
};

export const getClinicById = async (tenantId: string, id: string) => ClinicModel.findOne({ _id: id, tenantId });

export const getClinicBySlug = async (tenantId: string, slug: string) => ClinicModel.findOne({ tenantId, slug });


