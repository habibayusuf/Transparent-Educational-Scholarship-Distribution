;; Student Verification Contract
;; Validates qualifications of applicants

;; Data Maps
(define-map students
  { student-id: principal }
  {
    name: (string-ascii 50),
    institution: (string-ascii 100),
    major: (string-ascii 50),
    enrollment-year: uint,
    graduation-year: uint,
    verified: bool
  }
)

(define-map verifiers
  { verifier-id: principal }
  {
    name: (string-ascii 50),
    institution: (string-ascii 100),
    active: bool
  }
)

;; Read-only functions
(define-read-only (get-student-info (student-id principal))
  (map-get? students { student-id: student-id })
)

(define-read-only (get-verifier-info (verifier-id principal))
  (map-get? verifiers { verifier-id: verifier-id })
)

(define-read-only (is-verified-student (student-id principal))
  (match (get-student-info student-id)
    student-info (get verified student-info)
    false
  )
)

;; Public functions
(define-public (register-as-student
    (name (string-ascii 50))
    (institution (string-ascii 100))
    (major (string-ascii 50))
    (enrollment-year uint)
    (graduation-year uint))
  (let ((sender tx-sender))
    (if (is-some (get-student-info sender))
      (err u1) ;; Already registered
      (ok (map-set students
        { student-id: sender }
        {
          name: name,
          institution: institution,
          major: major,
          enrollment-year: enrollment-year,
          graduation-year: graduation-year,
          verified: false
        }
      ))
    )
  )
)

(define-public (register-as-verifier (name (string-ascii 50)) (institution (string-ascii 100)))
  (let ((sender tx-sender))
    (if (is-some (get-verifier-info sender))
      (err u1) ;; Already registered
      (ok (map-set verifiers
        { verifier-id: sender }
        {
          name: name,
          institution: institution,
          active: true
        }
      ))
    )
  )
)

(define-public (verify-student (student-id principal))
  (let (
    (sender tx-sender)
    (verifier-info (get-verifier-info sender))
    (student-info (get-student-info student-id))
  )
    (if (and
          (is-some verifier-info)
          (get active (unwrap-panic verifier-info))
          (is-some student-info)
        )
      (ok (map-set students
        { student-id: student-id }
        {
          name: (get name (unwrap-panic student-info)),
          institution: (get institution (unwrap-panic student-info)),
          major: (get major (unwrap-panic student-info)),
          enrollment-year: (get enrollment-year (unwrap-panic student-info)),
          graduation-year: (get graduation-year (unwrap-panic student-info)),
          verified: true
        }
      ))
      (err u2) ;; Invalid verifier or student
    )
  )
)

(define-public (update-student-info
    (name (string-ascii 50))
    (institution (string-ascii 100))
    (major (string-ascii 50))
    (enrollment-year uint)
    (graduation-year uint))
  (let (
    (sender tx-sender)
    (student-info (get-student-info sender))
  )
    (if (is-some student-info)
      (ok (map-set students
        { student-id: sender }
        {
          name: name,
          institution: institution,
          major: major,
          enrollment-year: enrollment-year,
          graduation-year: graduation-year,
          verified: false ;; Reset verification when info is updated
        }
      ))
      (err u3) ;; Student not found
    )
  )
)
