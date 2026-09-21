import {InstitutionModel, UserRole} from './user';

export class RegisterModel {
  username = "";
  password = "";

  firstName = "";
  lastName = "";
  phone = "";
  email = "";
  profileImage: File | null = null;

  role: UserRole = "individualClient";

  institution = new InstitutionModel();
}
