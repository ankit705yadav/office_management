import { DataTypes, Model, Optional } from 'sequelize';
import bcrypt from 'bcrypt';
import sequelize from '../config/database';
import { UserRole, UserStatus } from '../types/enums';

interface UserAttributes {
  id: number;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: Date;
  dateOfJoining: Date;
  role: UserRole;
  status: UserStatus;
  departmentId?: number;
  managerId?: number;
  profileImageUrl?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  panNumber?: string;
  aadharNumber?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'role' | 'status'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public email!: string;
  public passwordHash!: string;
  public firstName!: string;
  public lastName!: string;
  public phone?: string;
  public dateOfBirth?: Date;
  public dateOfJoining!: Date;
  public role!: UserRole;
  public status!: UserStatus;
  public departmentId?: number;
  public managerId?: number;
  public profileImageUrl?: string;
  public address?: string;
  public emergencyContactName?: string;
  public emergencyContactPhone?: string;
  public panNumber?: string;
  public aadharNumber?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Virtual fields
  public get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Method to validate password
  public async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
  }

  // Method to hash password
  public static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  // Exclude password from JSON
  public toJSON(): Partial<UserAttributes> {
    const values = { ...this.get() };
    delete (values as any).passwordHash;
    return values;
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash',
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'first_name',
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'last_name',
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'date_of_birth',
    },
    dateOfJoining: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'date_of_joining',
    },
    role: {
      type: DataTypes.ENUM(...Object.values(UserRole)),
      defaultValue: UserRole.EMPLOYEE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(UserStatus)),
      defaultValue: UserStatus.ACTIVE,
      allowNull: false,
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'department_id',
    },
    managerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'manager_id',
    },
    profileImageUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'profile_image_url',
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    emergencyContactName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'emergency_contact_name',
    },
    emergencyContactPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'emergency_contact_phone',
    },
    panNumber: {
      type: DataTypes.STRING(10),
      allowNull: true,
      field: 'pan_number',
    },
    aadharNumber: {
      type: DataTypes.STRING(12),
      allowNull: true,
      field: 'aadhar_number',
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.passwordHash) {
          user.passwordHash = await User.hashPassword(user.passwordHash);
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('passwordHash')) {
          user.passwordHash = await User.hashPassword(user.passwordHash);
        }
      },
    },
  }
);

export default User;
