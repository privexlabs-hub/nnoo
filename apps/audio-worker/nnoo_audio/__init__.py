"""Nnọọ audio worker. Holds no database or storage credentials: it claims a job from the
`jobs` function, reads and writes only the presigned URLs it is given, and reports back."""
