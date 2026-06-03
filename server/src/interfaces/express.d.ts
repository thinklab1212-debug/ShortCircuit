// ============================================================================
// ElectroKart — Express Request Type Augmentation
// ============================================================================
// Extends the Express Request interface to include:
//   - `user`  — Authenticated user payload (attached by auth middleware)
//   - `file`  — Single uploaded file (Multer)
//   - `files` — Multiple uploaded files (Multer)
//
// This is a global declaration merge — no import needed. TypeScript
// automatically picks up .d.ts files in the project.
//
// IMPORTANT: This file must NOT contain any import/export statements at
//            the top level, or it stops being an ambient declaration and
//            the module augmentation won't work. We use `import()` type
//            syntax inside the declaration block instead.
// ============================================================================

declare namespace Express {
  /**
   * Authenticated user payload attached to `req.user` by the auth middleware.
   * Contains the decoded JWT claims plus the full user document reference.
   */
  interface AuthenticatedUser {
    /** MongoDB ObjectId as string */
    _id: string;
    /** User's email address */
    email: string;
    /** User's role for RBAC checks */
    role: 'customer' | 'vendor' | 'admin';
    /** User's first name */
    firstName: string;
    /** User's last name */
    lastName: string;
    /** Whether the user account is blocked */
    isBlocked: boolean;
    /** Whether the user's email is verified */
    isEmailVerified: boolean;
  }

  /**
   * Multer file object for single file uploads.
   */
  interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
  }

  // --------------------------------------------------------------------------
  // Extend Express.Request
  // --------------------------------------------------------------------------

  interface Request {
    /**
     * Authenticated user payload. Populated by `auth.middleware.ts` after
     * JWT verification. Undefined on public routes.
     *
     * @example
     *   // In a protected controller:
     *   const userId = req.user!._id;
     *   const isAdmin = req.user!.role === 'admin';
     */
    user?: AuthenticatedUser;

    /**
     * Single uploaded file (set by Multer's `.single()` middleware).
     * Available on routes like `PATCH /users/me/avatar`.
     */
    file?: MulterFile;

    /**
     * Multiple uploaded files (set by Multer's `.array()` or `.fields()`).
     * Available on routes like `POST /products/:id/images`.
     */
    files?: MulterFile[] | { [fieldname: string]: MulterFile[] };
  }
}
