import {InstitutionModel, UserRole} from './user';

export class RegisterModel {
  username = "";
  password = "";

  firstName = "";
  lastName = "";
  phone = "";
  email = "";

  role: UserRole = "individualClient";

  institution = new InstitutionModel();
}
