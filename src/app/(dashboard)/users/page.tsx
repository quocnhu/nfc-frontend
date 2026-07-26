"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Table, Button, Modal, Form, Input, Select, Space, Tabs, message,
  Popconfirm, Tag, Checkbox, Typography, Divider, Upload, Avatar,
  Slider, Switch, Tooltip,
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined, LockOutlined,
  SafetyOutlined, UserOutlined, TeamOutlined,
  CameraOutlined, CheckCircleOutlined, CloseCircleOutlined, PictureOutlined, ScissorOutlined,
  RotateLeftOutlined, RotateRightOutlined, UnlockOutlined, StopOutlined, ClockCircleOutlined,
  CrownOutlined,
} from "@ant-design/icons";
import dynamic from "next/dynamic";
import { userApi, roleApi, permissionApi, dashboardApi, userdataApi, paymentApi } from "@/lib/api";
import { getCroppedImg } from "@/lib/cropImage";
import { useAvatarSync } from "@/hooks/useAvatarSync";
import type { User, Role, Permission } from "@/types";

const Cropper = dynamic(() => import("react-easy-crop").then(mod => mod.default), { ssr: false });

export default function UsersPage() {
  const { uploadAvatarForUser, selectAvatar } = useAvatarSync();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  // User modal
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm] = Form.useForm();

  // Role modal
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleForm] = Form.useForm();
  const [selectedRolePerms, setSelectedRolePerms] = useState<string[]>([]);
  const [roleName, setRoleName] = useState('');

  // Individual permissions modal
  const [permModalOpen, setPermModalOpen] = useState(false);
  const [permTargetUser, setPermTargetUser] = useState<User | null>(null);
  const [rolePermNames, setRolePermNames] = useState<string[]>([]);
  const [directPermIds, setDirectPermIds] = useState<string[]>([]);

  // Role assign modal
  const [roleAssignModalOpen, setRoleAssignModalOpen] = useState(false);
  const [assignTargetRole, setAssignTargetRole] = useState<Role | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Avatar upload modal
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [avatarTargetUser, setAvatarTargetUser] = useState<User | null>(null);
  const [avatarFileList, setAvatarFileList] = useState<any[]>([]);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarHistory, setAvatarHistory] = useState<{ name: string; url: string; path: string }[]>([]);

  // Plan management modal
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [planTargetUser, setPlanTargetUser] = useState<User | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");

  // Crop modal state
  const [avatarCropModalOpen, setAvatarCropModalOpen] = useState(false);
  const [avatarCropImage, setAvatarCropImage] = useState("");
  const [avatarCrop, setAvatarCrop] = useState({ x: 0, y: 0 });
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarRotation, setAvatarRotation] = useState(0);
  const [avatarCroppedAreaPixels, setAvatarCroppedAreaPixels] = useState<any>(null);
  const [avatarPendingFile, setAvatarPendingFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [currentUserPermissions, setCurrentUserPermissions] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [usersPagination, setUsersPagination] = useState({ current: 1, pageSize: 10 });
  const [rolesPagination, setRolesPagination] = useState({ current: 1, pageSize: 10 });
  const [permsPagination, setPermsPagination] = useState({ current: 1, pageSize: 10 });
  const [bulkSelectedUserIds, setBulkSelectedUserIds] = useState<string[]>([]);
  const [bulkSelectedRoleIds, setBulkSelectedRoleIds] = useState<string[]>([]);

  const getErrorMessage = (err: any): string => {
    const data = err?.response?.data;
    if (data?.message) {
      const msg = Array.isArray(data.message) ? data.message.join(", ") : data.message;
      return msg;
    }
    return "Something went wrong";
  };

  const setBackendErrors = (err: any, form: any, fieldMap: Record<string, string[]>) => {
    const data = err?.response?.data;
    const messages: string[] = Array.isArray(data?.message) ? data.message : data?.message ? [data.message] : [];
    const fieldErrors: { name: string; errors: string[] }[] = [];
    for (const msg of messages) {
      for (const [field, keywords] of Object.entries(fieldMap)) {
        if (keywords.some((kw) => msg.toLowerCase().includes(kw.toLowerCase()))) {
          const existing = fieldErrors.find((f) => f.name === field);
          if (existing) {
            existing.errors.push(msg);
          } else {
            fieldErrors.push({ name: field, errors: [msg] });
          }
        }
      }
    }
    if (fieldErrors.length > 0) {
      form.setFields(fieldErrors);
    } else if (messages.length > 0) {
      messageApi.error(messages.join(", "));
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes, permsRes, myPermsRes] = await Promise.allSettled([
        userApi.list({ page: 1, limit: 50 }),
        roleApi.list(),
        permissionApi.list(),
        dashboardApi.permissions(),
      ]);
      if (usersRes.status === "fulfilled") {
        setUsers(usersRes.value.data?.data?.data || []);
      } else {
        console.error("Failed to load users:", usersRes.reason);
        messageApi.error("Failed to load users");
      }
      if (rolesRes.status === "fulfilled") {
        setRoles(rolesRes.value.data?.data || []);
      } else {
        console.error("Failed to load roles:", rolesRes.reason);
      }
      if (permsRes.status === "fulfilled") {
        setPermissions(permsRes.value.data?.data || []);
      } else {
        console.error("Failed to load permissions:", permsRes.reason);
      }
      if (myPermsRes.status === "fulfilled") {
        const permData = myPermsRes.value.data?.data;
        setCurrentUserPermissions(permData?.mergedPermissions || []);
        setCurrentUserId(permData?.user?.id || "");
      } else {
        console.error("Failed to load permissions:", myPermsRes.reason);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
      messageApi.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const hasReadAll = currentUserPermissions.includes("read:user:all");
  const hasUpdateUser = currentUserPermissions.includes("update:user");
  const hasReadRole = currentUserPermissions.includes("read:role");
  const hasReadPermission = currentUserPermissions.includes("read:permission");

  useEffect(() => { load(); }, []);

  // ─── User CRUD ───

  const handleCreateUser = () => {
    setEditingUser(null);
    userForm.resetFields();
    const userRole = roles.find((r) => r.name === "USER");
    if (userRole) userForm.setFieldsValue({ roleId: userRole.id });
    setUserModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    userForm.setFieldsValue({ fullname: user.fullname });
    setUserModalOpen(true);
  };

  const handleDeleteUser = async (user: User) => {
    if (user.role?.name === "ADMIN") {
      messageApi.warning("Cannot delete admin user");
      return;
    }
    try {
      await userApi.remove(user.id);
      messageApi.success("User deleted");
      load();
    } catch (err: any) {
      messageApi.error(getErrorMessage(err));
    }
  };

  const handleBulkDeleteUsers = async () => {
    if (!bulkSelectedUserIds.length) {
      messageApi.warning("Please select users to delete");
      return;
    }
    const adminUsers = users.filter(u => bulkSelectedUserIds.includes(u.id) && u.role?.name === "ADMIN");
    if (adminUsers.length) {
      messageApi.warning("Cannot delete admin users");
      return;
    }
    if (bulkSelectedUserIds.includes(currentUserId)) {
      messageApi.warning("Cannot delete yourself");
      return;
    }
    try {
      await userApi.bulkDelete(bulkSelectedUserIds);
      messageApi.success(`Deleted ${bulkSelectedUserIds.length} user(s)`);
      setBulkSelectedUserIds([]);
      load();
    } catch (err: any) {
      messageApi.error(getErrorMessage(err));
    }
  };

  const handleUnlockUser = async (user: User) => {
    try {
      await userApi.unlock(user.id);
      messageApi.success(`Account unlocked for ${user.fullname}`);
      load();
    } catch (err: any) {
      messageApi.error(getErrorMessage(err));
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await userApi.toggleStatus(user.id);
      messageApi.success(`Status updated for ${user.fullname}`);
      load();
    } catch (err: any) {
      messageApi.error(getErrorMessage(err));
    }
  };

  const handleUserSubmit = async () => {
    try {
      setModalLoading(true);
      const values = await userForm.validateFields();
      if (editingUser) {
        const payload: any = { id: editingUser.id, fullname: values.fullname };
        await userApi.update(payload);
        messageApi.success("User updated");
      } else {
        await userApi.create({ email: values.email, password: values.password, fullname: values.fullname, roleId: values.roleId });
        messageApi.success("User created");
      }
      setUserModalOpen(false);
      load();
    } catch (err: any) {
      if (err?.errorFields) return;
      setBackendErrors(err, userForm, {
        fullname: ["fullname", "Fullname"],
        email: ["email", "Email"],
        password: ["password", "Password"],
        newPassword: ["newPassword", "Password"],
      });
    } finally {
      setModalLoading(false);
    }
  };

  // ─── Individual Permissions ───

  const handleOpenPerms = async (user: User) => {
    setPermTargetUser(user);
    setDirectPermIds([]);
    try {
      const res = await dashboardApi.userPermissions(user.id);
      const data = res.data?.data;
      setRolePermNames(data?.rolePermissions || []);
      setDirectPermIds(
        permissions
          .filter((p) => data?.directPermissions?.includes(p.name))
          .map((p) => p.id)
      );
    } catch {
      setRolePermNames([]);
      setDirectPermIds([]);
    }
    setPermModalOpen(true);
  };

  const handlePermSubmit = async () => {
    try {
      setModalLoading(true);
      await userApi.assignPermissions(permTargetUser!.id, directPermIds);
      messageApi.success(`Permissions updated for ${permTargetUser!.fullname}`);
      setPermModalOpen(false);
      load();
    } catch (err: any) {
      if (err?.errorFields) return;
      messageApi.error(getErrorMessage(err));
    } finally {
      setModalLoading(false);
    }
  };

  const toggleDirectPerm = (permId: string) => {
    setDirectPermIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  // ─── Role CRUD ───

  const handleCreateRole = () => {
    setEditingRole(null);
    roleForm.resetFields();
    setRoleName('');
    setSelectedRolePerms([]);
    setRoleModalOpen(true);
  };

  const handleEditRole = (role: Role) => {
    if (role.name === "ADMIN") {
      messageApi.warning("ADMIN role cannot be modified");
      return;
    }
    setEditingRole(role);
    setRoleName(role.name);
    roleForm.setFieldsValue({ name: role.name });
    setSelectedRolePerms(role.permissions?.map((p) => p.id) || []);
    setRoleModalOpen(true);
  };

  const handleDeleteRole = async (id: string, name: string) => {
    if (name === "ADMIN") {
      messageApi.warning("ADMIN role cannot be deleted");
      return;
    }
    try {
      await roleApi.remove(id);
      messageApi.success("Role deleted");
      load();
    } catch (err: any) {
      messageApi.error(getErrorMessage(err));
    }
  };

  const handleBulkDeleteRoles = async () => {
    if (!bulkSelectedRoleIds.length) {
      messageApi.warning("Please select roles to delete");
      return;
    }
    const adminRoles = roles.filter(r => bulkSelectedRoleIds.includes(r.id) && r.name === "ADMIN");
    if (adminRoles.length) {
      messageApi.warning("ADMIN role cannot be deleted");
      return;
    }
    try {
      await roleApi.bulkDelete(bulkSelectedRoleIds);
      messageApi.success(`Deleted ${bulkSelectedRoleIds.length} role(s)`);
      setBulkSelectedRoleIds([]);
      load();
    } catch (err: any) {
      messageApi.error(getErrorMessage(err));
    }
  };

  const handleRoleSubmit = async () => {
    try {
      setModalLoading(true);
      const values = await roleForm.validateFields();
      if (editingRole) {
        await roleApi.update({ id: editingRole.id, name: values.name, permissionIds: selectedRolePerms });
        messageApi.success("Role updated");
      } else {
        await roleApi.create({ name: values.name });
        messageApi.success("Role created");
      }
      setRoleModalOpen(false);
      load();
    } catch (err: any) {
      if (err?.errorFields) return;
      setBackendErrors(err, roleForm, {
        name: ["name", "Name", "role"],
      });
    } finally {
      setModalLoading(false);
    }
  };

  const toggleRolePerm = (permId: string) => {
    setSelectedRolePerms((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  // ─── Role Assign Users ───

  const handleOpenRoleAssign = (role: Role) => {
    setAssignTargetRole(role);
    const roleUserIds = users.filter((u) => u.roleId === role.id).map((u) => u.id);
    setSelectedUserIds(roleUserIds);
    setRoleAssignModalOpen(true);
  };

  const handleRoleAssignSubmit = async () => {
    if (!assignTargetRole) return;
    try {
      setModalLoading(true);
      const currentIds = users.filter((u) => u.roleId === assignTargetRole.id).map((u) => u.id);
      const toAdd = selectedUserIds.filter((id) => !currentIds.includes(id));
      const toRemove = currentIds.filter((id) => !selectedUserIds.includes(id));
      const defaultRole = roles.find((r) => r.name === "USER");
      await Promise.all([
        ...toAdd.map((id) => userApi.update({ id, roleId: assignTargetRole.id })),
        ...toRemove.map((id) => userApi.update({ id, roleId: defaultRole?.id || "" })),
      ]);
      messageApi.success(`Users updated for ${assignTargetRole.name}`);
      setRoleAssignModalOpen(false);
      load();
    } catch (err: any) {
      messageApi.error(getErrorMessage(err));
    } finally {
      setModalLoading(false);
    }
  };

  const toggleUserInRole = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // ─── Avatar Upload (with crop) ───

  const handleOpenAvatarUpload = async (user: User) => {
    setAvatarTargetUser(user);
    setAvatarFileList([]);
    setAvatarHistory([]);
    setAvatarModalOpen(true);
    try {
      const res = await userdataApi.listAdminAvatars(user.id);
      setAvatarHistory(res.data?.data || []);
    } catch {
      setAvatarHistory([]);
    }
  };

  /** Select an existing avatar as active */
  const handleSelectExistingAvatar = async (filename: string) => {
    if (!avatarTargetUser) return;
    try {
      await selectAvatar(avatarTargetUser.id, filename);
      messageApi.success(`Avatar updated for ${avatarTargetUser.fullname}`);
      setAvatarModalOpen(false);
      load();
    } catch (err: any) {
      messageApi.error(getErrorMessage(err));
    }
  };

  /** Called when user selects a file inside the avatar modal dragger */
  const handleAvatarFileSelect = (file: File) => {
    const url = URL.createObjectURL(file);
    setAvatarCropImage(url);
    setAvatarPendingFile(file);
    setAvatarCrop({ x: 0, y: 0 });
    setAvatarZoom(1);
    setAvatarRotation(0);
    setAvatarModalOpen(false); // close the file picker, open crop
    setAvatarCropModalOpen(true);
  };

  const onAvatarCropComplete = useCallback((_: any, croppedPixels: any) => {
    setAvatarCroppedAreaPixels(croppedPixels);
  }, []);

  /** Confirm crop → upload the cropped blob */
  const handleAvatarCropConfirm = async () => {
    if (!avatarPendingFile || !avatarCroppedAreaPixels || !avatarTargetUser) return;

    try {
      const { blob } = await getCroppedImg(avatarCropImage, avatarCroppedAreaPixels, 512, 512);
      const croppedFile = new File([blob], avatarPendingFile.name, { type: "image/jpeg" });

      setAvatarCropModalOpen(false);
      setAvatarUploading(true);

      const uploadedUrl = await uploadAvatarForUser(avatarTargetUser.id, croppedFile);
      messageApi.success(`Avatar updated for ${avatarTargetUser.fullname}`);
      load();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Upload failed";
      messageApi.error(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setAvatarUploading(false);
      setAvatarPendingFile(null);
      URL.revokeObjectURL(avatarCropImage);
    }
  };

  const handleAvatarCropCancel = () => {
    setAvatarCropModalOpen(false);
    setAvatarPendingFile(null);
    URL.revokeObjectURL(avatarCropImage);
  };

  // ─── Plan Management ───

  const handleOpenPlanModal = async (user: User) => {
    setPlanTargetUser(user);
    try {
      const [plansRes, statusRes] = await Promise.all([
        paymentApi.plans(),
        paymentApi.userSubscriptions(user.id),
      ]);
      setPlans(plansRes.data?.data || []);
      const currentSub = statusRes.data?.data?.find((s: any) => s.isCurrent);
      setSelectedPlanId(currentSub?.planId || "");
    } catch (err) {
      console.error("Failed to load plans:", err);
      setPlans([]);
    }
    setPlanModalOpen(true);
  };

  const handleUpdatePlan = async () => {
    if (!planTargetUser || !selectedPlanId) return;
    
    try {
      setModalLoading(true);
      await paymentApi.adminChangePlan(planTargetUser.id, selectedPlanId);
      messageApi.success(`Plan updated for ${planTargetUser.fullname}`);
      setPlanModalOpen(false);
      load();
    } catch (err: any) {
      messageApi.error(getErrorMessage(err));
    } finally {
      setModalLoading(false);
    }
  };

  // ─── Grouped permissions ───

  const permGroups = permissions.reduce((acc, p) => {
    const [action, resource] = p.name.split(":");
    const group = resource || "other";
    if (!acc[group]) acc[group] = [];
    acc[group].push({ ...p, action });
    return acc;
  }, {} as Record<string, (Permission & { action: string })[]>);

  // ─── Columns ───

  const userColumns = [
    { title: "#", key: "index", width: 60, align: 'center' as const, render: (_: any, __: any, i: number) => (usersPagination.current - 1) * usersPagination.pageSize + i + 1 },
    {
      title: "Avatar",
      key: "avatar",
      width: 70,
      align: 'center' as const,
      render: (_: any, record: User) => (
        record.avatarUrl ? (
          <Avatar size={40} src={record.avatarUrl} shape="circle" style={{ cursor: "pointer" }} />
        ) : (
          <Avatar size={40} shape="circle" style={{ backgroundColor: "#4f46e5", fontSize: 14, fontWeight: 600 }}>
            {record.fullname?.charAt(0)?.toUpperCase()}
          </Avatar>
        )
      ),
    },
    { title: "Fullname", dataIndex: "fullname", key: "fullname", align: 'center' as const, filterSearch: true,
      filters: [...new Set(users.map((u) => u.fullname))].map((n) => ({ text: n, value: n })),
      onFilter: (value: any, record: User) => record.fullname.includes(value),
    },
    { title: "Email", dataIndex: "email", key: "email", align: 'center' as const, filterSearch: true,
      filters: [...new Set(users.map((u) => u.email))].map((n) => ({ text: n, value: n })),
      onFilter: (value: any, record: User) => record.email.includes(value),
    },
    {
      title: "Role",
      key: "role",
      align: 'center' as const,
      filters: [...new Set(users.map((u) => u.role?.name).filter(Boolean))].map((r) => ({ text: r!, value: r! })),
      onFilter: (value: any, record: User) => record.role?.name === value,
      render: (_: any, record: User) => (
        <Tag color={record.role?.name === "ADMIN" ? "red" : record.role?.name === "VIP" ? "gold" : "blue"}>
          {record.role?.name}
        </Tag>
      ),
    },
    {
      title: "Verified",
      key: "verified",
      align: 'center' as const,
      filters: [{ text: "Verified", value: true }, { text: "Not Verified", value: false }],
      onFilter: (value: any, record: User) => record.isEmailVerified === value,
      render: (_: any, record: User) => record.isEmailVerified
        ? <Tag color="green" icon={<CheckCircleOutlined />}>Verified</Tag>
        : <Tag color="red" icon={<CloseCircleOutlined />}>Not Verified</Tag>,
    },
    {
      title: "Status",
      key: "status",
      align: 'center' as const,
      filters: [{ text: "Active", value: "active" }, { text: "Inactive", value: "inactive" }, { text: "Locked", value: "locked" }],
      onFilter: (value: any, record: User) => {
        const isLocked = record.lockedUntil && new Date(record.lockedUntil) > new Date();
        if (value === "locked") return !!isLocked;
        if (value === "inactive") return !isLocked && record.status === "INACTIVE";
        return !isLocked && record.status !== "INACTIVE";
      },
      render: (_: any, record: User) => {
        const isLocked = record.lockedUntil && new Date(record.lockedUntil) > new Date();
        if (isLocked) {
          return <Tag color="red" icon={<LockOutlined />}>Locked</Tag>;
        }
        if (record.status === "INACTIVE") {
          return <Tag color="red" icon={<StopOutlined />}>Inactive</Tag>;
        }
        return <Tag color="green" icon={<CheckCircleOutlined />}>Active</Tag>;
      },
    },
    {
      title: "Plan",
      key: "subscription",
      width: 120,
      align: 'center' as const,
      render: (_: any, record: any) => {
        const subscription = record.subscriptions?.[0];
        if (!subscription || !subscription.plan) {
          return <Tag color="default">No Plan</Tag>;
        }
        const planName = subscription.plan.displayName || subscription.plan.name;
        const planColor = subscription.plan.name === "PROPLUS" ? "gold" : subscription.plan.name === "PRO" ? "blue" : "default";
        return (
          <Space direction="vertical" size={0}>
            <Tag color={planColor}>{planName}</Tag>
            <Typography.Text style={{ fontSize: 11, color: "#6e6e73" }}>
              {subscription.status}
            </Typography.Text>
          </Space>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      align: 'center' as const,
      render: (_: any, record: User) => {
        if (hasReadAll) {
          const isLocked = record.lockedUntil && new Date(record.lockedUntil) > new Date();
          return (
            <Space size="small">
              <Button size="small" icon={<CameraOutlined />} onClick={() => handleOpenAvatarUpload(record)} title="Upload Avatar" />
              <Button size="small" icon={<EditOutlined />} onClick={() => handleEditUser(record)} title="Edit" />
              <Button size="small" icon={<CrownOutlined />} onClick={() => handleOpenPlanModal(record)} title="Change Plan" />
              <Button size="small" icon={<SafetyOutlined />} onClick={() => handleOpenPerms(record)} title="Individual Permissions" />
              {record.role?.name !== "ADMIN" && (
                <>
                  {record.status === "INACTIVE" ? (
                    record.isEmailVerified ? (
                      <Popconfirm title="Activate this user?" onConfirm={() => handleToggleStatus(record)}>
                        <Button size="small" icon={<CheckCircleOutlined />} style={{ color: "#52c41a", borderColor: "#52c41a" }} title="Activate" />
                      </Popconfirm>
                    ) : (
                      <Tooltip title="Email not verified">
                        <Button size="small" icon={<CheckCircleOutlined />} style={{ color: "#d9d9d9", borderColor: "#d9d9d9" }} disabled title="Email not verified" />
                      </Tooltip>
                    )
                  ) : (
                    <Popconfirm title="Disable this user?" onConfirm={() => handleToggleStatus(record)}>
                      <Button size="small" icon={<StopOutlined />} style={{ color: "#ff4d4f", borderColor: "#ff4d4f" }} title="Disable" />
                    </Popconfirm>
                  )}
                </>
              )}
              {isLocked && (
                <Popconfirm title="Unlock this account?" onConfirm={() => handleUnlockUser(record)}>
                  <Button size="small" icon={<UnlockOutlined />} title="Unlock" />
                </Popconfirm>
              )}
              {record.role?.name !== "ADMIN" && (
                <Popconfirm title="Delete user?" onConfirm={() => handleDeleteUser(record)}>
                  <Button size="small" danger icon={<DeleteOutlined />} title="Delete" />
                </Popconfirm>
              )}
            </Space>
          );
        }
        if (record.id === currentUserId) {
          return (
            <Space size="small">
              <Button size="small" icon={<CameraOutlined />} onClick={() => handleOpenAvatarUpload(record)} title="Upload Avatar" />
              {hasUpdateUser && (
                <Button size="small" icon={<EditOutlined />} onClick={() => handleEditUser(record)} title="Edit" />
              )}
            </Space>
          );
        }
        return null;
      },
    },
  ];

  const roleColumns = [
    { title: "#", key: "index", width: 60, align: 'center' as const, render: (_: any, __: any, i: number) => (rolesPagination.current - 1) * rolesPagination.pageSize + i + 1 },
    { title: "Role", dataIndex: "name", key: "name", align: 'center' as const, filterSearch: true,
      filters: roles.map((r) => ({ text: r.name, value: r.name })),
      onFilter: (value: any, record: Role) => record.name === value,
    },
    {
      title: "Permissions",
      key: "permissions",
      align: 'center' as const,
      render: (_: any, record: Role) => (
        <Typography.Text type="secondary">{record.permissions?.length || 0} permissions</Typography.Text>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: 'center' as const,
      render: (_: any, record: Role) => (
        <Space>
          {record.name !== "ADMIN" ? (
            <>
              <Button size="small" icon={<EditOutlined />} onClick={() => handleEditRole(record)} title="Edit Role" />
              <Button size="small" icon={<TeamOutlined />} onClick={() => handleOpenRoleAssign(record)} title="Assign Users" />
              <Popconfirm title="Delete role?" onConfirm={() => handleDeleteRole(record.id, record.name)}>
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </>
          ) : (
            <Tag color="red">Fixed</Tag>
          )}
        </Space>
      ),
    },
  ];

  const permColumns = [
    { title: "#", key: "index", width: 60, align: 'center' as const, render: (_: any, __: any, i: number) => (permsPagination.current - 1) * permsPagination.pageSize + i + 1 },
    { title: "Permission", dataIndex: "name", key: "name", align: 'center' as const, filterSearch: true,
      filters: permissions.map((p) => ({ text: p.name, value: p.name })),
      onFilter: (value: any, record: Permission) => record.name.includes(value),
    },
  ];

  return (
    <>
      {contextHolder}
      <Tabs
        defaultActiveKey="users"
        items={[
          {
            key: "users",
            label: "Users",
            children: (
              <>
                <Space style={{ marginBottom: 16 }}>
                  {hasReadAll && (
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateUser}>
                      Create User
                    </Button>
                  )}
                  {hasReadAll && bulkSelectedUserIds.length > 0 && (
                    <Popconfirm
                      title={`Delete ${bulkSelectedUserIds.length} selected user(s)?`}
                      onConfirm={handleBulkDeleteUsers}
                      okText="Delete"
                      okType="danger"
                    >
                      <Button danger icon={<DeleteOutlined />}>
                        Delete Selected ({bulkSelectedUserIds.length})
                      </Button>
                    </Popconfirm>
                  )}
                </Space>
                <Table
                  loading={loading}
                  columns={userColumns}
                  dataSource={users}
                  rowKey="id"
                  scroll={{ x: 'max-content' }}
                  pagination={{ current: usersPagination.current, pageSize: usersPagination.pageSize, showSizeChanger: true, showTotal: (total) => `Total ${total} users`, onChange: (page, size) => setUsersPagination({ current: page, pageSize: size }) }}
                  rowSelection={hasReadAll ? {
                    selectedRowKeys: bulkSelectedUserIds,
                    onChange: (keys) => setBulkSelectedUserIds(keys.map(k => String(k))),
                    getCheckboxProps: (record: User) => ({
                      disabled: record.role?.name === "ADMIN" || record.id === currentUserId,
                    }),
                  } : undefined}
                />
              </>
            ),
          },
          ...(hasReadAll
            ? [
                {
                  key: "roles",
                  label: "Roles",
                  children: (
                    <>
                      <Space style={{ marginBottom: 16 }}>
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateRole}>
                          Create Role
                        </Button>
                        {bulkSelectedRoleIds.length > 0 && (
                          <Popconfirm
                            title={`Delete ${bulkSelectedRoleIds.length} selected role(s)?`}
                            onConfirm={handleBulkDeleteRoles}
                            okText="Delete"
                            okType="danger"
                          >
                            <Button danger icon={<DeleteOutlined />}>
                              Delete Selected ({bulkSelectedRoleIds.length})
                            </Button>
                          </Popconfirm>
                        )}
                      </Space>
                      <Table
                        loading={loading}
                        columns={roleColumns}
                        dataSource={roles}
                        rowKey="id"
                        scroll={{ x: 'max-content' }}
                        pagination={{ current: rolesPagination.current, pageSize: rolesPagination.pageSize, showSizeChanger: true, showTotal: (total) => `Total ${total} roles`, onChange: (page, size) => setRolesPagination({ current: page, pageSize: size }) }}
                        rowSelection={{
                          selectedRowKeys: bulkSelectedRoleIds,
                          onChange: (keys) => setBulkSelectedRoleIds(keys.map(k => String(k))),
                          getCheckboxProps: (record: Role) => ({
                            disabled: record.name === "ADMIN",
                          }),
                        }}
                      />
                    </>
                  ),
                },
                {
                  key: "permissions",
                  label: "Permissions",
                  children: <Table loading={loading} columns={permColumns} dataSource={permissions} key="permissions" rowKey="id" scroll={{ x: 'max-content' }} pagination={{ current: permsPagination.current, pageSize: permsPagination.pageSize, showSizeChanger: true, showTotal: (total) => `Total ${total} permissions`, onChange: (page, size) => setPermsPagination({ current: page, pageSize: size }) }} />,
                },
              ]
            : [
                ...(hasReadRole
                  ? [{
                      key: "roles",
                      label: "Roles",
                      children: (
                        <Table loading={loading} columns={roleColumns} dataSource={roles} key="roles-view" rowKey="id" scroll={{ x: 'max-content' }} pagination={{ current: rolesPagination.current, pageSize: rolesPagination.pageSize, showSizeChanger: true, showTotal: (total) => `Total ${total} roles`, onChange: (page, size) => setRolesPagination({ current: page, pageSize: size }) }} />
                      ),
                    }]
                  : []),
                ...(hasReadPermission
                  ? [{
                      key: "permissions",
                      label: "Permissions",
                      children: <Table loading={loading} columns={permColumns} dataSource={permissions} key="permissions-view" rowKey="id" scroll={{ x: 'max-content' }} pagination={{ current: permsPagination.current, pageSize: permsPagination.pageSize, showSizeChanger: true, showTotal: (total) => `Total ${total} permissions`, onChange: (page, size) => setPermsPagination({ current: page, pageSize: size }) }} />,
                    }]
                  : []),
              ]),
        ]}
      />

      {/* ─── User Modal ─── */}
      <Modal
        title={editingUser ? "Edit User" : "Create User"}
        open={userModalOpen}
        onOk={handleUserSubmit}
        confirmLoading={modalLoading}
        onCancel={() => setUserModalOpen(false)}
      >
        <Form form={userForm} layout="vertical">
          <Form.Item name="fullname" label="Fullname" rules={[{ required: true }]}>
            <Input prefix={<UserOutlined />} />
          </Form.Item>
          {editingUser ? (
            <Form.Item label="Email">
              <Input value={editingUser.email} disabled prefix={<LockOutlined />} />
            </Form.Item>
          ) : (
            <>
              <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}>
                <Input />
              </Form.Item>
              <Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}>
                <Input.Password />
              </Form.Item>
            </>
          )}
          {editingUser && (
            <>
              <Divider style={{ margin: "12px 0" }}>Change Password (optional)</Divider>
              <Form.Item name="newPassword" label="New Password" rules={[{ min: 6, message: "Password must be at least 6 characters" }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="Leave empty to keep current" />
              </Form.Item>
              <Form.Item
                name="confirmNewPassword"
                label="Confirm New Password"
                dependencies={["newPassword"]}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value && !getFieldValue("newPassword")) return Promise.resolve();
                      if (!value) return Promise.reject(new Error("Please confirm the new password"));
                      if (getFieldValue("newPassword") === value) return Promise.resolve();
                      return Promise.reject(new Error("Passwords do not match"));
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Re-enter new password" />
              </Form.Item>
            </>
          )}
          {!editingUser && (
            <Form.Item name="roleId" label="Role" rules={[{ required: true, message: "Please select a role" }]}>
              <Select options={roles.map((r) => ({ label: r.name, value: r.id }))} />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* ─── Individual Permissions Modal ─── */}
      <Modal
        title={`Permissions — ${permTargetUser?.fullname}`}
        open={permModalOpen}
        onOk={handlePermSubmit}
        confirmLoading={modalLoading}
        onCancel={() => setPermModalOpen(false)}
        width={650}
        style={{ maxWidth: '90vw' }}
      >
        <Space style={{ marginBottom: 16 }}>
          <Tag color="blue">From Role (fixed)</Tag>
          <Tag color="green">Individual (editable)</Tag>
        </Space>
        {Object.entries(permGroups).map(([resource, perms]) => (
          <div key={resource} style={{ marginBottom: 16 }}>
            <Typography.Text strong style={{ textTransform: "capitalize", fontSize: 13 }}>{resource}</Typography.Text>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
              {perms.map((p) => {
                const isFromRole = rolePermNames.includes(p.name);
                const isDirect = directPermIds.includes(p.id);
                return (
                  <Checkbox
                    key={p.id}
                    checked={isFromRole || isDirect}
                    disabled={isFromRole}
                    onChange={() => toggleDirectPerm(p.id)}
                    style={{
                      color: isFromRole ? "#1677ff" : isDirect ? "#52c41a" : undefined,
                      fontWeight: isFromRole ? 500 : 400,
                    }}
                  >
                    {p.name}
                  </Checkbox>
                );
              })}
            </div>
          </div>
        ))}
      </Modal>

      {/* ─── Role Modal ─── */}
      <Modal
        title={editingRole ? `Edit Role: ${editingRole.name}` : "Create Role"}
        open={roleModalOpen}
        onOk={handleRoleSubmit}
        confirmLoading={modalLoading}
        onCancel={() => setRoleModalOpen(false)}
        width={650}
        style={{ maxWidth: '90vw' }}
      >
        <Form form={roleForm} layout="vertical">
          <Form.Item 
            name="name" 
            label="Role Name" 
            rules={[{ required: true }]}
          >
            <Input 
              disabled={editingRole?.name === "ADMIN"} 
              value={roleName}
              style={{ textTransform: 'uppercase' }}
              onChange={(e) => {
                const upperValue = e.target.value.toUpperCase();
                setRoleName(upperValue);
                roleForm.setFieldsValue({ name: upperValue });
              }}
            />
          </Form.Item>
        </Form>
        <Divider>Permissions</Divider>
        {Object.entries(permGroups).map(([resource, perms]) => (
          <div key={resource} style={{ marginBottom: 12 }}>
            <Typography.Text strong style={{ textTransform: "capitalize" }}>{resource}</Typography.Text>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
              {perms.map((p) => (
                <Checkbox
                  key={p.id}
                  checked={selectedRolePerms.includes(p.id)}
                  onChange={() => toggleRolePerm(p.id)}
                >
                  {p.name}
                </Checkbox>
              ))}
            </div>
          </div>
        ))}
      </Modal>

      {/* ─── Role Assign Users Modal ─── */}
      <Modal
        title={`Assign Users — ${assignTargetRole?.name || ""}`}
        open={roleAssignModalOpen}
        onOk={handleRoleAssignSubmit}
        confirmLoading={modalLoading}
        onCancel={() => setRoleAssignModalOpen(false)}
        width={520}
        style={{ maxWidth: '90vw' }}
      >
        <Typography.Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
          Select users to assign to this role. Users currently assigned to other roles will be moved.
        </Typography.Text>
        {assignTargetRole?.name === "ADMIN" ? (
          <Typography.Text type="warning">ADMIN role cannot have users manually assigned.</Typography.Text>
        ) : (
          <div style={{ maxHeight: 360, overflowY: "auto", border: "1px solid #f0f0f0", borderRadius: 8, padding: 8 }}>
            {users.length === 0 ? (
              <Typography.Text type="secondary">No users found</Typography.Text>
            ) : (
              users.filter((u) => u.role?.name !== "ADMIN").map((u) => {
                const checked = selectedUserIds.includes(u.id);
                const assignedElsewhere = u.roleId && u.roleId !== assignTargetRole?.id && u.role?.name !== "ADMIN";
                return (
                  <div
                    key={u.id}
                    onClick={() => toggleUserInRole(u.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 10px",
                      borderRadius: 6,
                      cursor: "pointer",
                      background: checked ? "rgba(79, 70, 229, 0.06)" : "transparent",
                      transition: "background 0.15s",
                    }}
                  >
                    <Checkbox checked={checked} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {u.fullname}
                      </div>
                      <div style={{ fontSize: 12, color: "#6e6e73", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {u.email}
                      </div>
                    </div>
                    {assignedElsewhere && (
                      <Tag color="orange" style={{ margin: 0, fontSize: 11, flexShrink: 0 }}>
                        Currently: {u.role?.name}
                      </Tag>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </Modal>

      {/* ─── Avatar Upload Modal (picker + history) ─── */}
      <Modal
        title={`Avatar — ${avatarTargetUser?.fullname || ""}`}
        open={avatarModalOpen}
        onCancel={() => setAvatarModalOpen(false)}
        footer={null}
        width={560}
        style={{ maxWidth: '90vw' }}
      >
        {avatarTargetUser && (
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            {avatarTargetUser.avatarUrl ? (
              <Avatar src={avatarTargetUser.avatarUrl} size={80} />
            ) : (
              <Avatar size={80} style={{ backgroundColor: "#4f46e5", fontSize: 28, fontWeight: 600 }}>
                {avatarTargetUser.fullname?.charAt(0)?.toUpperCase()}
              </Avatar>
            )}
            <div style={{ marginTop: 8, fontSize: 13, color: "#6e6e73" }}>Current avatar</div>
          </div>
        )}

        {/* Upload new */}
        <Upload.Dragger
          accept=".jpg,.jpeg,.png"
          multiple={false}
          fileList={[]}
          beforeUpload={(file) => {
            if (file instanceof File) handleAvatarFileSelect(file);
            return false;
          }}
          showUploadList={false}
          style={{ marginBottom: avatarHistory.length > 0 ? 16 : 0 }}
        >
          <p className="ant-upload-drag-icon">
            <PictureOutlined style={{ color: "#4f46e5" }} />
          </p>
          <p className="ant-upload-text">Upload a new avatar</p>
          <p className="ant-upload-hint">JPEG or PNG, max 3MB. You&apos;ll crop it before upload.</p>
        </Upload.Dragger>

        {/* Previous avatars */}
        {avatarHistory.length > 0 && (
          <div>
            <Typography.Text strong style={{ display: "block", marginBottom: 10, fontSize: 13 }}>
              Previous Avatars
            </Typography.Text>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 10 }}>
              {avatarHistory.map((av) => {
                const isActive = avatarTargetUser?.avatarUrl?.includes(av.name);
                return (
                  <div
                    key={av.name}
                    onClick={() => handleSelectExistingAvatar(av.name)}
                    style={{
                      position: "relative",
                      borderRadius: 10,
                      overflow: "hidden",
                      cursor: "pointer",
                      border: isActive ? "2px solid #4f46e5" : "2px solid transparent",
                      transition: "border-color 0.15s",
                    }}
                  >
                    <img
                      src={av.url}
                      alt={av.name}
                      style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }}
                    />
                    {isActive && (
                      <div style={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        background: "#4f46e5",
                        borderRadius: "50%",
                        width: 22,
                        height: 22,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        <CheckCircleOutlined style={{ color: "#fff", fontSize: 12 }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Avatar Crop Modal ─── */}
      <Modal
        title={<Space><ScissorOutlined /> Crop Avatar</Space>}
        open={avatarCropModalOpen}
        onOk={handleAvatarCropConfirm}
        onCancel={handleAvatarCropCancel}
        confirmLoading={avatarUploading}
        okText="Upload Cropped"
        width={520}
        style={{ maxWidth: '90vw' }}
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ position: "relative", width: "100%", height: "clamp(250px, 50vw, 400px)", background: "#1a1a2e" }}>
          {avatarCropImage && (
            // @ts-expect-error react-easy-crop types
            <Cropper
              image={avatarCropImage}
              crop={avatarCrop}
              zoom={avatarZoom}
              rotation={avatarRotation}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setAvatarCrop}
              onZoomChange={setAvatarZoom}
              onCropComplete={onAvatarCropComplete}
              style={{ containerStyle: { borderRadius: 8 } }}
            />
          )}
        </div>
        <div style={{ padding: "12px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <RotateLeftOutlined style={{ color: "#a0a0b0" }} />
            <Typography.Text style={{ minWidth: 40, textAlign: "center", fontSize: 13 }}>{avatarRotation}°</Typography.Text>
            <Slider min={0} max={360} value={avatarRotation} onChange={setAvatarRotation} style={{ flex: 1 }} />
            <RotateRightOutlined style={{ color: "#a0a0b0" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Typography.Text style={{ fontSize: 13 }}>Zoom</Typography.Text>
            <Slider min={1} max={3} step={0.1} value={avatarZoom} onChange={setAvatarZoom} style={{ flex: 1 }} />
          </div>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            Output: 512×512 JPEG. Drag to position, scroll to zoom.
          </Typography.Text>
        </div>
      </Modal>
      {/* ─── Plan Management Modal ─── */}
      <Modal
        title={`Manage Plan — ${planTargetUser?.fullname || ""}`}
        open={planModalOpen}
        onOk={handleUpdatePlan}
        confirmLoading={modalLoading}
        onCancel={() => setPlanModalOpen(false)}
        width={500}
      >
        <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
          Select a plan for this user.
        </Typography.Paragraph>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {plans.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            const planColor = plan.name === "PROPLUS" ? "#faad14" : plan.name === "PRO" ? "#4f46e5" : "#6e6e73";
            
            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                style={{
                  padding: "16px",
                  borderRadius: 12,
                  border: `2px solid ${isSelected ? planColor : "#f0f0f0"}`,
                  background: isSelected ? `${planColor}08` : "#fff",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <Space style={{ width: "100%", justifyContent: "space-between" }}>
                  <div>
                    <Typography.Title level={5} style={{ margin: 0, color: planColor }}>
                      {plan.displayName}
                    </Typography.Title>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {plan.description}
                    </Typography.Text>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <Typography.Title level={4} style={{ margin: 0, color: planColor }}>
                      ${plan.price.toFixed(2)}
                    </Typography.Title>
                    <Typography.Text style={{ fontSize: 11, color: "#6e6e73" }}>
                      {plan.durationDays === 0 ? "30 min" : plan.durationDays <= 30 ? `${plan.durationDays} days` : `${plan.durationDays / 365} year(s)`}
                    </Typography.Text>
                  </div>
                </Space>
              </div>
            );
          })}
        </div>
      </Modal>
    </>
  );
}
