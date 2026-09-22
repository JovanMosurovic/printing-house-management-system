export type UserRole = | "individualClient" | "businessClient" | "printer" | "admin";

export type UserStatus = | "pending" | "approved" | "rejected";

export class InstitutionModel {
  _id?: string;

  name = ""
  address = ""
  city = ""
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

export function copyUser(user: UserModel) {
  let userCopy = new UserModel();

  userCopy._id = user._id;
  userCopy.username = user.username;
  userCopy.firstName = user.firstName;
  userCopy.lastName = user.lastName;
  userCopy.phone = user.phone;
  userCopy.email = user.email;
  userCopy.profileImage = user.profileImage;
  userCopy.role = user.role;
  userCopy.status = user.status;
  userCopy.lastLogin = user.lastLogin;
  userCopy.createdAt = user.createdAt;
  userCopy.updatedAt = user.updatedAt;

  if (user.institution) {
    let institutionCopy = new InstitutionModel();
    institutionCopy._id = user.institution._id;
    institutionCopy.name = user.institution.name;
    institutionCopy.address = user.institution.address;
    institutionCopy.city = user.institution.city;
    institutionCopy.registrationNumber = user.institution.registrationNumber;
    institutionCopy.taxId = user.institution.taxId;
    userCopy.institution = institutionCopy;
  }

  return userCopy;
}
