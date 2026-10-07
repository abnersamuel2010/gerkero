# Security Specification — Sabor & Brasa Gestão de Restaurante

## 1. Data Invariants
1. **Default Deny Catch-All**: All paths not explicitly matched in `firestore.rules` are denied by default.
2. **Path Variable Hardening**: Every document ID path variable (`{userId}`, `{produtoId}`, `{pedidoId}`, etc.) must match `^[a-zA-Z0-9_\-]+$` and have `.size() <= 128`.
3. **Verified Identity & Admin Isolation**: Admin privilege checks validating `request.auth.token.email == 'robertokeylatomaz@gmail.com'` strictly require `request.auth.token.email_verified == true`.
4. **Role-Based Access Control (RBAC)**:
   - `administrador`: Full CRUD access to all restaurant collections and user management.
   - `caixa`: Access to `caixas`, `movimentacoesCaixa`, `pagamentos`, `pedidos`, `comandas`, `mesas`.
   - `atendente`: Access to `mesas`, `comandas`, `itensComanda`, `pedidos`, `itensPedido`, `pedidosCozinha`, `clientes`.
   - `cozinha`: Access to `pedidosCozinha` and updating preparation status on `pedidos`.
   - `entregador`: Access to `entregas`, `entregadores`, and delivery status on `pedidos`.
5. **PII Protection**: User documents (`/usuarios/{userId}`) and customer PII (`/clientes/{clienteId}`) cannot be read via unauthenticated blanket queries; access is restricted to the document owner or verified restaurant staff/admin.
6. **Strict Schema & Size Boundaries**: Every string field is bounded by `.size() <= maxLength` matching `firebase-blueprint.json`, and every `create`/`update` calls `isValid[Entity](incoming())`.

## 2. The "Dirty Dozen" Payloads
1. **Payload 1 (Shadow Field Injection on Produto)**: Adding `{"isHacked": true}` to `/produtos/prod_1`. Rejected by `hasOnly()`.
2. **Payload 2 (Unverified Admin Email Spoofing)**: Token with `email: "robertokeylatomaz@gmail.com"` and `email_verified: false` attempting to delete `/produtos/prod_1`. Rejected by `email_verified == true`.
3. **Payload 3 (Self-Assigned Admin Role Escalation)**: Non-admin user creating `/usuarios/user_2` with `funcao: "administrador"` for another UID. Rejected by `isOwner(userId)` and role validation.
4. **Payload 4 (ID Poisoning Attack)**: Creating document with 500-char ID or special characters. Rejected by `isValidId()`.
5. **Payload 5 (String Overflow / Denial of Wallet)**: Creating `/pedidos/ped_1` with `observacoes` of length 10,000 chars (`maxLength: 300`). Rejected by `isValidPedido()`.
6. **Payload 6 (Negative Price Injection)**: Creating `/produtos/prod_2` with `preco: -50`. Rejected by `data.preco >= 0`.
7. **Payload 7 (Invalid Enum on Mesa Status)**: Updating `/mesas/mesa_1` with `status: "hacked_status"`. Rejected by enum list check.
8. **Payload 8 (Cross-User Profile Overwrite)**: Authenticated user `uid_A` updating `/usuarios/uid_B` without admin role. Rejected by `isAdmin() || isOwner(userId)`.
9. **Payload 9 (Unauthenticated Write to Caixa)**: Anonymous/unauthenticated request attempting to create `/caixas/caixa_1`. Rejected by `isSignedIn()`.
10. **Payload 10 (Invalid Payment Method Enum)**: Creating `/pagamentos/pag_1` with `formaPagamento: "bitcoin"`. Rejected by `isValidPagamento()`.
11. **Payload 11 (Missing Required Fields on Comanda)**: Creating `/comandas/com_1` without `mesaId` or `total`. Rejected by `hasAll()`.
12. **Payload 12 (Value Poisoning on Update)**: Updating `/entregadores/ent_1` with `status: 12345` (number instead of string). Rejected by `isValidEntregador(incoming())`.
