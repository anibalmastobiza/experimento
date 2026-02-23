#!/usr/bin/env Rscript

suppressPackageStartupMessages({
  library(ggplot2)
})

# Classical-style static diagram inspired by Churchland (1995)
# No legend; explicit axis activation labels + parameter note.

rot_x <- function(a) {
  matrix(c(
    1, 0, 0,
    0, cos(a), -sin(a),
    0, sin(a), cos(a)
  ), nrow = 3, byrow = TRUE)
}

rot_y <- function(a) {
  matrix(c(
    cos(a), 0, sin(a),
    0, 1, 0,
    -sin(a), 0, cos(a)
  ), nrow = 3, byrow = TRUE)
}

rot_z <- function(a) {
  matrix(c(
    cos(a), -sin(a), 0,
    sin(a), cos(a), 0,
    0, 0, 1
  ), nrow = 3, byrow = TRUE)
}

project_points <- function(df, theta = 0.88, phi = 0.56, gamma = -0.21, zoom = 1.68, persp = 0.76) {
  centered <- as.matrix(df[, c("x", "y", "z")]) -
    matrix(c(0.5, 0.5, 0.5), nrow = nrow(df), ncol = 3, byrow = TRUE)
  rot <- rot_z(theta) %*% rot_x(phi) %*% rot_y(gamma)
  rotated <- centered %*% t(rot)
  depth <- 2.3 + rotated[, 3] * persp
  extras <- df[, setdiff(names(df), c("x", "y", "z")), drop = FALSE]

  cbind(
    data.frame(
      u = rotated[, 1] / depth * zoom,
      v = rotated[, 2] / depth * zoom,
      x = df$x,
      y = df$y,
      z = df$z
    ),
    extras
  )
}

cube_vertices <- matrix(
  c(
    0, 0, 0,
    1, 0, 0,
    1, 1, 0,
    0, 1, 0,
    0, 0, 1,
    1, 0, 1,
    1, 1, 1,
    0, 1, 1
  ),
  byrow = TRUE,
  ncol = 3
)

cube_edges <- matrix(
  c(
    1, 2,
    2, 3,
    3, 4,
    4, 1,
    5, 6,
    6, 7,
    7, 8,
    8, 5,
    1, 5,
    2, 6,
    3, 7,
    4, 8
  ),
  byrow = TRUE,
  ncol = 2
)

# Decision manifold (plane as quadrilateral)
plane <- data.frame(
  x = c(0.44, 0.62, 0.82, 0.60),
  y = c(0.04, 0.96, 0.96, 0.04),
  z = c(0.06, 0.16, 0.95, 0.84)
)

proto_mine <- data.frame(x = 0.31, y = 0.66, z = 0.62)
proto_rock <- data.frame(x = 0.73, y = 0.39, z = 0.44)

edge_df <- do.call(
  rbind,
  lapply(seq_len(nrow(cube_edges)), function(i) {
    a <- cube_edges[i, 1]
    b <- cube_edges[i, 2]
    data.frame(
      edge = i,
      x = c(cube_vertices[a, 1], cube_vertices[b, 1]),
      y = c(cube_vertices[a, 2], cube_vertices[b, 2]),
      z = c(cube_vertices[a, 3], cube_vertices[b, 3])
    )
  })
)

axes <- rbind(
  data.frame(axis = "n1", x = 0, y = 0, z = 0),
  data.frame(axis = "n1", x = 1, y = 0, z = 0),
  data.frame(axis = "n2", x = 0, y = 1, z = 0),
  data.frame(axis = "n3", x = 0, y = 0, z = 1)
)

proj_edges <- project_points(edge_df)
proj_plane <- project_points(plane)
proj_mine <- project_points(proto_mine)
proj_rock <- project_points(proto_rock)
proj_axes <- project_points(axes)

origin <- proj_axes[proj_axes$axis == "n1", ][1, ]
n1_tip <- proj_axes[proj_axes$axis == "n1", ][2, ]
n2_tip <- proj_axes[proj_axes$axis == "n2", ][1, ]
n3_tip <- proj_axes[proj_axes$axis == "n3", ][1, ]

callout_mine <- data.frame(
  x = proj_mine$u + 0.00, y = proj_mine$v + 0.05,
  tx = proj_mine$u - 0.02, ty = proj_mine$v + 0.20
)
callout_rock <- data.frame(
  x = proj_rock$u + 0.03, y = proj_rock$v - 0.01,
  tx = proj_rock$u + 0.25, ty = proj_rock$v - 0.07
)

all_u <- c(proj_edges$u, proj_plane$u, proj_mine$u, proj_rock$u, callout_mine$tx, callout_rock$tx)
all_v <- c(proj_edges$v, proj_plane$v, proj_mine$v, proj_rock$v, callout_mine$ty, callout_rock$ty)
u_limits <- c(min(all_u) - 0.10, max(all_u) + 0.10)
v_limits <- c(min(all_v) - 0.10, max(all_v) + 0.10)

p <- ggplot() +
  geom_polygon(
    data = proj_plane,
    aes(u, v),
    fill = "grey72",
    alpha = 0.55,
    color = "grey30",
    linewidth = 0.4
  ) +
  geom_path(
    data = proj_edges,
    aes(u, v, group = edge),
    color = "grey18",
    linewidth = 0.55
  ) +
  geom_point(
    data = proj_mine,
    aes(u, v),
    shape = 21,
    fill = "grey95",
    color = "grey18",
    stroke = 0.55,
    size = 9
  ) +
  geom_point(
    data = proj_rock,
    aes(u, v),
    shape = 21,
    fill = "grey95",
    color = "grey18",
    stroke = 0.55,
    size = 9
  ) +
  geom_segment(
    aes(
      x = callout_mine$x,
      y = callout_mine$y,
      xend = callout_mine$tx,
      yend = callout_mine$ty
    ),
    linewidth = 0.45,
    color = "grey18"
  ) +
  geom_segment(
    aes(
      x = callout_rock$x,
      y = callout_rock$y,
      xend = callout_rock$tx,
      yend = callout_rock$ty
    ),
    linewidth = 0.45,
    color = "grey18"
  ) +
  annotate(
    "text",
    x = callout_mine$tx,
    y = callout_mine$ty + 0.02,
    label = "Region of prototypical\nmine-like vectors",
    hjust = 0.5,
    vjust = 0,
    size = 4.8,
    color = "grey10"
  ) +
  annotate(
    "text",
    x = callout_rock$tx + 0.01,
    y = callout_rock$ty,
    label = "Region of prototypical\nrock-like vectors",
    hjust = 0,
    vjust = 0.5,
    size = 4.8,
    color = "grey10"
  ) +
  annotate(
    "text",
    x = (origin$u + n1_tip$u) / 2 - 0.07,
    y = (origin$v + n1_tip$v) / 2 + 0.18,
    label = "Neuron #1 activation (0-1)",
    angle = 90,
    size = 4.4,
    color = "grey10"
  ) +
  annotate(
    "text",
    x = (origin$u + n2_tip$u) / 2 - 0.02,
    y = (origin$v + n2_tip$v) / 2 - 0.10,
    label = "Neuron #2 activation (0-1)",
    angle = -15,
    size = 4.4,
    color = "grey10"
  ) +
  annotate(
    "text",
    x = (origin$u + n3_tip$u) / 2 + 0.10,
    y = (origin$v + n3_tip$v) / 2 - 0.10,
    label = "Neuron #3 activation (0-1)",
    angle = 17,
    size = 4.4,
    color = "grey10"
  ) +
  annotate(
    "text",
    x = u_limits[1] + 0.01,
    y = v_limits[1] + 0.01,
    label = "Parameters: a = (a1, a2, a3), ai in [0,1], each point = one activation pattern.",
    hjust = 0,
    vjust = 0,
    size = 4.0,
    color = "grey16"
  ) +
  coord_equal(xlim = u_limits, ylim = v_limits, expand = FALSE, clip = "off") +
  theme_void(base_size = 12) +
  theme(
    plot.background = element_rect(fill = "white", color = "black", linewidth = 1),
    panel.background = element_rect(fill = "white", color = NA),
    plot.margin = margin(18, 18, 28, 18)
  )

dir.create("outputs", showWarnings = FALSE)
outfile <- "outputs/churchland_1995_classic_style.png"
ggsave(
  filename = outfile,
  plot = p,
  width = 12,
  height = 7.3,
  dpi = 360,
  bg = "white"
)

cat("Saved:", outfile, "\n")
