;; Donor Management Contract
;; Records contributions to scholarship funds

;; Data Maps
(define-map donors
  { donor-id: principal }
  {
    total-donated: uint,
    last-donation-amount: uint,
    last-donation-time: uint,
    active: bool
  }
)

(define-map scholarship-funds
  { fund-id: uint }
  {
    fund-name: (string-ascii 50),
    total-balance: uint,
    active: bool,
    created-by: principal
  }
)

(define-map donations
  { donation-id: uint }
  {
    donor: principal,
    fund-id: uint,
    amount: uint,
    timestamp: uint
  }
)

;; Variables
(define-data-var donation-counter uint u0)
(define-data-var fund-counter uint u0)

;; Read-only functions
(define-read-only (get-donor-info (donor-id principal))
  (map-get? donors { donor-id: donor-id })
)

(define-read-only (get-fund-info (fund-id uint))
  (map-get? scholarship-funds { fund-id: fund-id })
)

(define-read-only (get-donation-info (donation-id uint))
  (map-get? donations { donation-id: donation-id })
)

;; Public functions
(define-public (register-as-donor)
  (let ((sender tx-sender))
    (if (is-some (get-donor-info sender))
      (err u1) ;; Already registered
      (ok (map-set donors
        { donor-id: sender }
        {
          total-donated: u0,
          last-donation-amount: u0,
          last-donation-time: u0,
          active: true
        }
      ))
    )
  )
)

(define-public (create-scholarship-fund (fund-name (string-ascii 50)))
  (let (
    (sender tx-sender)
    (new-fund-id (+ (var-get fund-counter) u1))
  )
    (begin
      (var-set fund-counter new-fund-id)
      (ok (map-set scholarship-funds
        { fund-id: new-fund-id }
        {
          fund-name: fund-name,
          total-balance: u0,
          active: true,
          created-by: sender
        }
      ))
    )
  )
)

(define-public (donate-to-fund (fund-id uint) (amount uint))
  (let (
    (sender tx-sender)
    (donor-info (get-donor-info sender))
    (fund-info (get-fund-info fund-id))
    (new-donation-id (+ (var-get donation-counter) u1))
    (current-time (unwrap-panic (get-block-info? time (- block-height u1))))
  )
    (if (and (is-some donor-info) (is-some fund-info))
      (begin
        (var-set donation-counter new-donation-id)
        (map-set donations
          { donation-id: new-donation-id }
          {
            donor: sender,
            fund-id: fund-id,
            amount: amount,
            timestamp: current-time
          }
        )
        (map-set donors
          { donor-id: sender }
          {
            total-donated: (+ (get total-donated (unwrap-panic donor-info)) amount),
            last-donation-amount: amount,
            last-donation-time: current-time,
            active: (get active (unwrap-panic donor-info))
          }
        )
        (map-set scholarship-funds
          { fund-id: fund-id }
          {
            fund-name: (get fund-name (unwrap-panic fund-info)),
            total-balance: (+ (get total-balance (unwrap-panic fund-info)) amount),
            active: (get active (unwrap-panic fund-info)),
            created-by: (get created-by (unwrap-panic fund-info))
          }
        )
        (ok new-donation-id)
      )
      (err u2) ;; Invalid donor or fund
    )
  )
)

(define-public (deactivate-donor)
  (let (
    (sender tx-sender)
    (donor-info (get-donor-info sender))
  )
    (if (is-some donor-info)
      (ok (map-set donors
        { donor-id: sender }
        {
          total-donated: (get total-donated (unwrap-panic donor-info)),
          last-donation-amount: (get last-donation-amount (unwrap-panic donor-info)),
          last-donation-time: (get last-donation-time (unwrap-panic donor-info)),
          active: false
        }
      ))
      (err u3) ;; Donor not found
    )
  )
)
