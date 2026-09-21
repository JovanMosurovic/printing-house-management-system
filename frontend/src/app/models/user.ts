export type UserRole = | "individualClient" | "businessClient" | "printer" | "admin";

export type UserStatus = | "pending" | "approved" | "rejected";

export class InstitutionModel {
  _id?: string;

  name = ""
  address = ""
  registrationNumber = ""
  taxId = ""
}

export class UserModel {
  _id = "";
  username = "";
  // password is not returned from back

  firstName = "";
  lastName = "";
  phone = "";
  email = "";
  profileImage = "";

  role: UserRole = "individualClient";
  status: UserStatus = "pending";

  institution?: InstitutionModel;

  lastLogin: string | null = null;

  createdAt = "";
  updatedAt = "";
}
