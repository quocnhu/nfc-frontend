"use client";

import { useEffect, useState } from "react";
import {
  Table, Button, Modal, Form, Input, Select, Space, Tabs, message,
  Popconfirm, Tag, Checkbox, Typography, Divider,
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined, LockOutlined,
  KeyOutlined, SafetyOutlined, UserOutlined, TeamOutlined,
} from "@ant-design/icons";
import { userApi, roleApi, permissionApi, dashboardApi } from "@/lib/api";
import type { User, Role, Permission } from "@/types";

export default function UsersPage() {
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

  // Password modal
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [pwTargetUser, setPwTargetUser] = useState<User | null>(null);
  const [pwForm] = Form.useForm();

  // Individual permissions modal
  const [permModalOpen, setPermModalOpen] = useState(false);
  const [permTargetUser, setPermTargetUser] = useState<User | null>(null);
  const [rolePermNames, setRolePermNames] = useState<string[]>([]);
  const [directPermIds, setDirectPermIds] = useState<string[]>([]);

  // Role assign modal
  const [roleAssignModalOpen, setRoleAssignModalOpen] = useState(false);
  const [assignTargetRole, setAssignTargetRole] = useState<Role | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

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
      const [usersRes, rolesRes, permsRes] = await Promise.allSettled([
        userApi.list({ page: 1, limit: 50 }),
        roleApi.list(),
        permissionApi.list(),
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
    } catch (err) {
      console.error("Failed to load data:", err);
      messageApi.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

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

  const handleUserSubmit = async () => {
    try {
      setModalLoading(true);
      const values = await userForm.validateFields();
      if (editingUser) {
        await userApi.update({ id: editingUser.id, fullname: values.fullname });
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
      });
    } finally {
      setModalLoading(false);
    }
  };

  // ─── Password Change ───

  const handleOpenPw = (user: User) => {
    setPwTargetUser(user);
    pwForm.resetFields();
    setPwModalOpen(true);
  };

  const handlePwSubmit = async () => {
    try {
      setModalLoading(true);
      const values = await pwForm.validateFields();
      await userApi.adminChangePassword({ id: pwTargetUser!.id, newPassword: values.newPassword });
      messageApi.success(`Password changed for ${pwTargetUser!.fullname}`);
      setPwModalOpen(false);
    } catch (err: any) {
      if (err?.errorFields) return;
      messageApi.error(getErrorMessage(err));
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
    setSelectedRolePerms([]);
    setRoleModalOpen(true);
  };

  const handleEditRole = (role: Role) => {
    if (role.name === "ADMIN") {
      messageApi.warning("ADMIN role cannot be modified");
      return;
    }
    setEditingRole(role);
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
      await Promise.all([
        ...toAdd.map((id) => userApi.update({ id, roleId: assignTargetRole.id })),
        ...toRemove.map((id) => userApi.update({ id, roleId: "" })),
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
    { title: "#", key: "index", width: 60, render: (_: any, __: any, i: number) => i + 1 },
    { title: "Fullname", dataIndex: "fullname", key: "fullname", filterSearch: true,
      filters: [...new Set(users.map((u) => u.fullname))].map((n) => ({ text: n, value: n })),
      onFilter: (value: any, record: User) => record.fullname.includes(value),
    },
    { title: "Email", dataIndex: "email", key: "email", filterSearch: true,
      filters: [...new Set(users.map((u) => u.email))].map((n) => ({ text: n, value: n })),
      onFilter: (value: any, record: User) => record.email.includes(value),
    },
    {
      title: "Role",
      key: "role",
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
      filters: [{ text: "Verified", value: true }, { text: "Not Verified", value: false }],
      onFilter: (value: any, record: User) => record.isEmailVerified === value,
      render: (_: any, record: User) => record.isEmailVerified ? "✅" : "❌",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: User) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEditUser(record)} title="Edit" />
          <Button size="small" icon={<KeyOutlined />} onClick={() => handleOpenPw(record)} title="Change Password" />
          <Button size="small" icon={<SafetyOutlined />} onClick={() => handleOpenPerms(record)} title="Individual Permissions" />
          {record.role?.name !== "ADMIN" && (
            <Popconfirm title="Delete user?" onConfirm={() => handleDeleteUser(record)}>
              <Button size="small" danger icon={<DeleteOutlined />} title="Delete" />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const roleColumns = [
    { title: "#", key: "index", width: 60, render: (_: any, __: any, i: number) => i + 1 },
    { title: "Role", dataIndex: "name", key: "name", filterSearch: true,
      filters: roles.map((r) => ({ text: r.name, value: r.name })),
      onFilter: (value: any, record: Role) => record.name === value,
    },
    {
      title: "Permissions",
      key: "permissions",
      render: (_: any, record: Role) => (
        <Typography.Text type="secondary">{record.permissions?.length || 0} permissions</Typography.Text>
      ),
    },
    {
      title: "Actions",
      key: "actions",
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
    { title: "#", key: "index", width: 60, render: (_: any, __: any, i: number) => i + 1 },
    { title: "Permission", dataIndex: "name", key: "name", filterSearch: true,
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
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateUser} style={{ marginBottom: 16 }}>
                  Create User
                </Button>
                <Table loading={loading} columns={userColumns} dataSource={users} rowKey="id" pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Total ${total} users` }} />
              </>
            ),
          },
          {
            key: "roles",
            label: "Roles",
            children: (
              <>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateRole} style={{ marginBottom: 16 }}>
                  Create Role
                </Button>
                <Table loading={loading} columns={roleColumns} dataSource={roles} rowKey="id" pagination={false} />
              </>
            ),
          },
          {
            key: "permissions",
            label: "Permissions",
            children: <Table loading={loading} columns={permColumns} dataSource={permissions} rowKey="id" pagination={false} />,
          },
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
          {!editingUser && (
            <Form.Item name="roleId" label="Role" rules={[{ required: true, message: "Please select a role" }]}>
              <Select options={roles.map((r) => ({ label: r.name, value: r.id }))} />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* ─── Password Modal ─── */}
      <Modal
        title={`Change Password — ${pwTargetUser?.fullname}`}
        open={pwModalOpen}
        onOk={handlePwSubmit}
        confirmLoading={modalLoading}
        onCancel={() => setPwModalOpen(false)}
      >
        <Form form={pwForm} layout="vertical">
          <Form.Item name="newPassword" label="New Password" rules={[{ required: true, min: 6 }]}>
            <Input.Password prefix={<KeyOutlined />} />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Confirm"
            dependencies={["newPassword"]}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) return Promise.resolve();
                  return Promise.reject(new Error("Passwords do not match"));
                },
              }),
            ]}
          >
            <Input.Password prefix={<KeyOutlined />} />
          </Form.Item>
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
      >
        <Form form={roleForm} layout="vertical">
          <Form.Item name="name" label="Role Name" rules={[{ required: true }]}>
            <Input disabled={editingRole?.name === "ADMIN"} />
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
    </>
  );
}
