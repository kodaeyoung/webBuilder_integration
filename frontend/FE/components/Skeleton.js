import React from "react";
import { Box, Skeleton } from "@mui/material";

const SkeletonTemplates = ({ templateStructure }) => {
  return (
    <Box
      sx={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 2 }}
    >
      {templateStructure.map((_, index) => (
        <Skeleton key={index} variant="rectangular" width="100%" height={200} />
      ))}
    </Box>
  );
};

const SkeletonDash = ({ dashStructure }) => {
  return (
    <Box
      sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2 }}
    >
      {dashStructure.map((_, index) => (
        <Skeleton key={index} variant="rectangular" width="100%" height={200} />
      ))}
    </Box>
  );
};

export { SkeletonTemplates, SkeletonDash };
