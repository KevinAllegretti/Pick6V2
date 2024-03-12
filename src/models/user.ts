type User = {
  username: string;
  password: string;  // Note: Storing passwords in plaintext is insecure. In production, always encrypt passwords.
};

const users: User[] = [
  { username: "LazyAhhGamer", password: "lazy456" },
  { username: "Bear Jew", password: "bear298" },
  { username: "porkSkinGooner", password: "pork223" },
  { username: "Primitive Picks", password: "prim142" },
  { username: "L to the OG", password: "L009" },
  { username: "Midnight Professional", password: "mid633" },
  { username: "Parlay Prodigy", password: "lay189" },
  { username: "TheDiggler", password: "dig890" }
];

export default users;
