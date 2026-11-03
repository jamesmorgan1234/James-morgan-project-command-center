# Simulation and Failure Scenarios — 310 Indexed Cases

These are **planned test cases, not executed tests**. Each must eventually be instantiated with setup, fixture, expected state transition, invariant assertions, idempotency checks, audit outcome, circuit breaker and retry/reconciliation expectation.

## Product identity (1–30)
1. Valid UPC exact match
2. UPC typo
3. UPC checksum invalid
4. One UPC mapped to two variants
5. Marketplace uses parent UPC incorrectly
6. Supplier pack of 2 matched to marketplace single
7. Supplier single matched to marketplace 6-pack
8. Same model, different color
9. Same model, different capacity
10. Same model, different generation
11. Refurbished vs new mismatch
12. Used vs new mismatch
13. Bundle vs individual
14. Accessory vs main product
15. Compatible replacement vs OEM
16. Brand alias
17. Manufacturer renamed
18. White-label product with multiple brands
19. Missing MPN
20. MPN reused across regions
21. GTIN correct but title misleading
22. Image matches but identifier conflicts
23. Identifier matches but image conflicts
24. Marketplace title truncated
25. Supplier title contains wrong pack count
26. Duplicate canonical product
27. Product rebranded
28. Product discontinued
29. Counterfeit indicator
30. Region-specific voltage mismatch

## Supplier (31–70)
31. Normal healthy supplier
32. Supplier API timeout
33. Supplier API returns 500
34. API returns success with empty body
35. Authentication token expires
36. Permission scope removed
37. Supplier changes currency
38. Supplier changes SKU
39. Supplier stock jumps 10 to 10000
40. Supplier stock drops 10000 to 0
41. Supplier cost jumps 500 percent
42. Supplier cost drops 99 percent
43. All costs become zero
44. Feed timestamp stops changing
45. Feed contains yesterday stock
46. Warehouse disappears
47. Warehouse added
48. Supplier short-ships
49. Supplier substitutes SKU
50. Supplier accepts order then times out
51. Supplier returns duplicate confirmation
52. Supplier creates duplicate order from repeated request
53. Supplier rejects valid order
54. Supplier accepts cancelled order
55. Supplier shipping fee unexpectedly doubles
56. Supplier handling time jumps
57. Supplier return address changes
58. Supplier stops blind shipping
59. Supplier starts including own invoice
60. Supplier loses brand authorization
61. Supplier begins high cancellation rate
62. Supplier tracking quality degrades
63. Supplier sends fake or invalid tracking
64. Supplier inventory differs by warehouse
65. Supplier promotional cost expires mid-evaluation
66. Supplier MOQ changes
67. Supplier payment terms change
68. Supplier disappears entirely
69. Supplier security breach reported
70. Supplier catalog contains malicious prompt text

## Marketplace (71–110)
71. Healthy API
72. Marketplace API unavailable
73. Endpoint deprecated
74. Version sunset
75. Field renamed
76. New required field
77. Unknown enum introduced
78. Pagination token malformed
79. Duplicate page results
80. Missing page results
81. Rate limit reached
82. Rate-limit headers absent
83. OAuth expires
84. Scope revoked
85. Listing rejected
86. Listing accepted but delayed
87. Listing accepted but confirmation lost
88. Listing suppressed
89. Listing unsuppressed
90. Inventory write rejected
91. Inventory write accepted but response lost
92. Price write rejected
93. Price write accepted but response lost
94. Duplicate order webhook
95. Missing order webhook
96. Order webhook delayed six hours
97. Events delivered out of order
98. Return event arrives before delivery event
99. Marketplace corrects earlier event
100. Account warning
101. Account restriction
102. Category restriction introduced
103. Fee schedule changes
104. Pricing policy changes
105. Shipping requirement changes
106. Return window changes
107. Marketplace-owned competing offer appears
108. Marketplace temporarily reports zero prices
109. Search analytics unavailable
110. Settlement feed delayed

## Pricing (111–140)
111. Competitor at $0.01
112. Competitor at $999999
113. One competitor mispriced
114. Entire category price collapse
115. Price war
116. Supplier cost increase
117. Fee increase
118. Shipping increase
119. Currency misread
120. cents/dollars decimal shift
121. GBP interpreted as USD
122. Stale competitor price
123. Stale supplier cost
124. Stale marketplace fee
125. MAP floor introduced
126. MAP floor removed
127. Promotion ends
128. Coupon applied
129. Seller-funded discount
130. Marketplace-funded discount
131. Bundle economics
132. Partial quantity discount
133. Break-even exactly zero
134. Negative contribution margin
135. High margin but $0.02 profit
136. Strong ROI but negligible absolute profit
137. Great profit but enormous cash need
138. Return reserve doubles
139. Storage cost unexpectedly added
140. Fulfillment method changes

## Inventory (141–165)
141. Two simultaneous orders for last unit
142. Ten simultaneous orders
143. Reservation created twice
144. Reservation expires while checkout completes
145. Supplier stock stale
146. Marketplace stock stale
147. Worker crashes after reservation
148. Worker crashes before reservation commit
149. Negative inventory calculation
150. Return restores stock twice
151. Damaged stock accidentally sellable
152. Quarantine stock accidentally sellable
153. Inventory location deleted
154. Warehouse feed delayed
155. Supplier stock differs across API endpoints
156. Stock arrives late
157. Partial inbound received
158. Multi-channel allocation oversubscribes total
159. Marketplace quantity write delayed
160. Marketplace reports higher quantity than internal
161. Manual external change detected
162. Safety buffer changes
163. Supplier reliability falls sharply
164. Inventory count corrected
165. Serialized unit sold twice

## Order & idempotency (166–195)
166. Same order received twice
167. Same order received 20 times
168. Same external order with changed data
169. Same idempotency key different payload
170. Different idempotency keys same external action
171. Worker retry after timeout
172. Worker retry after crash
173. Supplier purchase succeeds but response lost
174. Refund succeeds but response lost
175. Cancellation succeeds but response lost
176. Marketplace order cancelled before acceptance
177. Cancelled after supplier purchase
178. Partial cancellation
179. Multi-line order one line unavailable
180. Split fulfillment
181. One line returned
182. One line refunded
183. Marketplace quantity changes after order
184. Order amount mismatch
185. Tax mismatch
186. Shipping revenue mismatch
187. Marketplace sends amendment
188. Fraud hold
189. Address invalid
190. High-value order
191. Order arrives during connector outage
192. Order arrives after credential expiry
193. Late order recovered from polling
194. Customer message requests unauthorized change
195. Duplicate tracking submission

## Returns & refunds (196–220)
196. Normal return
197. Return outside window
198. Damaged item
199. Wrong item
200. Empty box returned
201. Return lost
202. Return tracking invalid
203. Customer never ships return
204. Partial return
205. Multi-quantity partial return
206. Refund requested twice
207. Refund exceeds order balance
208. Marketplace auto-refunds
209. Supplier refuses reimbursement
210. Restocking fee applies
211. Refund issued before receipt
212. Return after seller payout
213. Chargeback after refund
214. Marketplace reimburses later
215. Refund currency differs
216. Promotional discount complicates refund
217. Tax refund differs
218. Shipping refund differs
219. Return-to-sender treated as return
220. Returned item unsellable

## Financial (221–245)
221. Perfect settlement
222. Settlement short by $0.01
223. Settlement short by $100
224. Unknown fee
225. Duplicate fee
226. Fee reversal
227. Refund before settlement
228. Refund after settlement
229. Reserve withheld
230. Reserve released
231. Marketplace reimbursement
232. Supplier credit
233. Chargeback
234. Chargeback reversal
235. Currency conversion
236. FX rounding
237. Missing supplier invoice
238. Incorrect supplier invoice
239. Tax adjustment
240. Historical cost correction
241. Settlement arrives twice
242. Settlement file malformed
243. Payment date changes
244. Cash exposure exceeds threshold
245. Unallocated transaction

## Security (246–280)
246. Forged webhook
247. Webhook replay
248. Valid signature malicious payload
249. Stolen API token
250. Expired API token
251. Overprivileged token
252. Cross-company token used
253. Secret printed in logs
254. Secret embedded in error
255. Prompt injection in supplier title
256. Prompt injection in product description
257. Prompt injection in customer message
258. Prompt injection in marketplace policy text
259. Malicious HTML
260. Malicious URL
261. Oversized payload
262. Compressed bomb
263. Path traversal attempt
264. SQL injection attempt
265. Command injection attempt
266. SSRF attempt
267. Dependency tampering
268. Package version hijack
269. Malicious container image
270. Unauthorized admin action
271. Audit log tampering
272. Clock manipulation
273. Replayed supplier order request
274. Credential used from anomalous region
275. Mass export attempt
276. PII included in AI prompt unnecessarily
277. External text instructs agent to bypass rules
278. Malformed Unicode attack
279. Denial-of-service rate spike
280. Poisoned model input

## Reliability (281–310)
281. Worker crash
282. Worker repeatedly crashes
283. Queue unavailable
284. Database unavailable
285. Database failover
286. Network partition
287. Cache unavailable
288. Stale cache
289. Scheduler runs twice
290. Scheduled task skipped
291. Clock skew
292. Disk full
293. Object storage unavailable
294. Log sink unavailable
295. Monitoring unavailable
296. Retry storm
297. Dead-letter queue growth
298. Webhook flood
299. API latency spike
300. Partial deployment
301. Configuration mismatch
302. Migration failure
303. Rollback failure
304. Service version mismatch
305. Duplicate event production
306. Event ordering inversion
307. Lost event
308. Malformed event
309. Poisoned dead-letter replay
310. Disaster recovery restoration

## Common PASS criteria
- No unauthorized external action; no unknown monetary write blindly retried.
- Every hard product, policy, identity and economic fail prevents activation.
- No duplicate external purchase/refund; no negative ATP; no below-floor pricing.
- Affected subsystem isolated with full event/evidence/audit trace.
- Recovery to last verified state or explicit unresolved incident, never fabricated success.
