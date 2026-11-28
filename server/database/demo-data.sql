SET NAMES utf8mb4;

USE campus_lost_found;

INSERT INTO users (
  username,
  password_hash,
  nickname,
  role
)
VALUES
  (
    'student1',
    '$2b$12$fk.gvVfshALRZ8vnTAJ5U.HFdYJvUUg4WOzTGPXC5n.yxSXOX8EfS',
    '测试同学',
    'user'
  ),
  (
    'admin',
    '$2b$12$Lvpr5JkMcFvFNfiOY/zLVOk2vxvi2cWzSWlkprbblw5HeX0uPUPyq',
    '管理员',
    'admin'
  )
ON DUPLICATE KEY UPDATE
  nickname = VALUES(nickname),
  role = VALUES(role);
