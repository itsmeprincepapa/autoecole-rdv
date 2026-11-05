// Les trois rôles de la plateforme.
// Les valeurs sont stockées telles quelles dans la base.
export enum UserRole {
  STUDENT = 'student', // élève : s'inscrit lui-même
  INSTRUCTOR = 'instructor', // moniteur : créé sur invitation du gérant
  ADMIN = 'admin', // gérant : créé par script ou par un autre admin
}