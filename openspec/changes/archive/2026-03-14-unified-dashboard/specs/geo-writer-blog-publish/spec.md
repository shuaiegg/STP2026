## ADDED Requirements

### Requirement: ADMIN sees "另存为博客草稿" button on geo-writer results
When geo-writer generation is complete (step 3), ADMIN users SHALL see an additional "另存为博客草稿" button alongside the existing "保存到内容库" button. This button SHALL NOT be visible to USER role.

#### Scenario: ADMIN sees blog draft button after generation
- **WHEN** an ADMIN user reaches step 3 of geo-writer with a completed result
- **THEN** a "另存为博客草稿" button SHALL be displayed in the action area
- **THEN** the "保存到内容库" button SHALL also remain visible

#### Scenario: USER does not see blog draft button
- **WHEN** a USER reaches step 3 of geo-writer with a completed result
- **THEN** NO "另存为博客草稿" button SHALL be displayed
- **THEN** only the "保存到内容库" button SHALL be visible

### Requirement: Blog draft saves content to Content table as DRAFT
Clicking "另存为博客草稿" SHALL invoke a server action that creates a new record in the `Content` table with `status: DRAFT`, `source: MANUAL`, `visibility: PRIVATE`, using the geo-writer's generated content and SEO metadata.

#### Scenario: Successful save to blog draft
- **WHEN** an ADMIN clicks "另存为博客草稿"
- **THEN** a new `Content` record SHALL be created with:
  - `title` from `finalResult.seoMetadata.title` (fallback: selected keyword)
  - `content` from the full joined markdown content
  - `summary` from `finalResult.seoMetadata.description`
  - `status: DRAFT`
  - `source: MANUAL`
  - `visibility: PRIVATE`
  - `slug` auto-generated from title (kebab-case, unique)
- **THEN** a success toast SHALL display

#### Scenario: Redirect to content edit page after save
- **WHEN** the blog draft is saved successfully
- **THEN** the browser SHALL navigate to `/dashboard/admin/content/edit/[newContentId]`

#### Scenario: Non-ADMIN cannot invoke blog draft server action
- **WHEN** a non-ADMIN user calls the `saveToBlogDraft` server action
- **THEN** the action SHALL return `{ success: false, message: 'Unauthorized' }`
- **THEN** NO Content record SHALL be created

#### Scenario: Save fails gracefully on error
- **WHEN** the server action encounters a database error
- **THEN** an error toast SHALL display with the failure reason
- **THEN** the user SHALL remain on the geo-writer page
