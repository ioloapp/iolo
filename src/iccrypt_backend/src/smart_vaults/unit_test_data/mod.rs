use super::secret::SecretCategory;
pub struct SecretTestData {
    pub category: SecretCategory,
    pub name: &'static str,
    pub username: &'static str,
    pub password: &'static str,
    pub url: &'static str,
    pub notes: &'static str
}

pub static TEST_SECRET_1: SecretTestData = SecretTestData {
    category: SecretCategory::Password,
    name: "Google",
    username: "user1@user.com",
    password: "123",
    url: "www.google.com",
    notes: "What a secure TEST_SECRET_1"
};

pub static TEST_SECRET_2: SecretTestData = SecretTestData {
    category: SecretCategory::Password,
    name: "Amazon",
    username: "user2@user.com",
    password: "456",
    url: "www.amazon.com",
    notes: "What a secure TEST_SECRET_2"
};

pub static TEST_SECRET_3: SecretTestData = SecretTestData {
    category: SecretCategory::Password,
    name: "Facebook",
    username: "user3@user.com",
    password: "789",
    url: "www.facebook.com",
    notes: "What a secure TEST_SECRET_3"
};

pub static TEST_SECRET_4: SecretTestData = SecretTestData {
    category: SecretCategory::Password,
    name: "Instagram",
    username: "user4@user.com",
    password: "!123!",
    url: "www.instragram.com",
    notes: "What a secure TEST_SECRET_4"
};
