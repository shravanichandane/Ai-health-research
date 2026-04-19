import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "local-secret-for-curalink-hackathon";

export const protect = (req, res, next) => {
  let token = req.headers.authorization;
  if (token && token.startsWith("Bearer")) {
    try {
      token = token.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      console.error(err);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

export const generateToken = (id, role) => {
  return jwt.sign({ id, role }, JWT_SECRET, { expiresIn: "30d" });
};
