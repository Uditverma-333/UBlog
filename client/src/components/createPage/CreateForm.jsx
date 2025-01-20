import {
  Button,
  Input,
  useToast,
  VStack,
  useColorModeValue,
  Box,
  Select,
  Flex,
  Heading,
  Divider,
  Image,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import BlogEditor from "../Editor/BlogEditor";
import { useDispatch, useSelector } from "react-redux";
import { publish, reset } from "../../redux/post/postSlice";
import { useNavigate } from "react-router-dom";

const CreateForm = () => {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [cover, setCover] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [isUploading, setIsUploading] = useState(false); // To track image upload
  const colorScheme = useColorModeValue("blue", "green");
  const borderColor = useColorModeValue("gray.300", "gray.300");

  // REDUX
  const dispatch = useDispatch();
  const { isPosting, isPosted, isErrorInPosting, message } = useSelector(
    (state) => state.post
  );
  const { token } = useSelector((state) => state.auth?.user);

  const navigate = useNavigate();

  useEffect(() => {
    if (isPosted) {
      toast({
        status: "success",
        description: message,
        duration: 2000,
        isClosable: true,
      });
      dispatch(reset());
      navigate(-1);
    }

    if (isErrorInPosting) {
      toast({
        status: "error",
        description: message,
        duration: 2000,
        isClosable: true,
      });
      dispatch(reset());
    }
  }, [isPosted, isErrorInPosting]);

  // Function to handle image upload to Cloudinary
  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "blog_image_upload"); // Replace with your Cloudinary preset
    formData.append("cloud_name", "dlxuekk2j"); // Replace with your Cloudinary cloud name

    try {
      setIsUploading(true);
      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dlxuekk2j/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await res.json();
      setCover(data.secure_url); // Set the Cloudinary image URL
      setIsUploading(false);
      toast({
        description: "Image uploaded successfully!",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (err) {
      setIsUploading(false);
      toast({
        description: "Failed to upload image. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleCreatePost = () => {
    if (
      title.length === 0 ||
      summary.length === 0 ||
      content.length === 0 ||
      !cover ||
      category.length === 0
    ) {
      toast({
        description: "Please fill all details",
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    const post = {
      title: title,
      category: category,
      summary: summary,
      content: content,
      cover: cover,
    };
    dispatch(publish({ post, token }));
  };

  return (
    <VStack spacing={5}>
      <Flex
        justifyContent="space-between"
        alignItems="center"
        w="100%"
        position="sticky"
      >
        <Heading fontSize={{ base: "2xl", md: "4xl" }}>
          Publish an Article
        </Heading>
        <Button
          colorScheme={colorScheme}
          onClick={handleCreatePost}
          isLoading={isPosting || isUploading}
          loadingText={isUploading ? "Uploading Image" : "Publishing"}
        >
          Publish
        </Button>
      </Flex>

      <Input
        type="text"
        placeholder="Topic"
        variant="unstyled"
        fontSize={{ base: "xl", md: "3xl" }}
        size="xl"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
        }}
        name="title"
        fontWeight="bold"
      />

      <Input
        placeholder="㊉ Add a Summary"
        variant="unstyled"
        fontSize={{ base: "xl", md: "2xl" }}
        size="xl"
        value={summary}
        onChange={(e) => {
          setSummary(e.target.value);
        }}
        name="summary"
      />
      <Divider borderColor={"gray.400"} />

      {cover && (
        <Image
          w="auto"
          maxW="250px"
          h="auto"
          src={cover}
          objectFit="cover"
          borderRadius="md"
          mb={4}
          boxShadow="md"
          alignSelf="flex-start"
        />
      )}

      <Flex alignItems="center" w="100%" justifyContent="space-between">
        <Input
          type="file"
          name="cover"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files[0]) {
              uploadToCloudinary(e.target.files[0]); // Upload image to Cloudinary
            }
          }}
          display="none"
          id="file-upload"
        />
        <Box
          cursor="pointer"
          border="1px"
          borderColor={borderColor}
          borderRadius="md"
          w="auto"
          p={2}
          display="flex"
          justifyContent="center"
          alignItems="center"
          maxW="200px"
        >
          <label htmlFor="file-upload">
            <Box
              as="span"
              fontSize={{ base: "md", md: "lg" }}
              color={colorScheme}
            >
              {cover ? "Change Image" : "Add Image"}
            </Box>
          </label>
        </Box>
      </Flex>

      <Select
        fontSize={{ base: "lg", md: "xl" }}
        placeholder="Select category"
        value={category}
        onChange={(e) => {
          setCategory(e.target.value);
        }}
      >
        <option value="Software Development">Software Development</option>
        <option value="JavaScript">JavaScript</option>
        <option value="Coding">Coding</option>
        <option value="React">React</option>
        <option value="Productivity">Productivity</option>
        <option value="Nodejs">Nodejs</option>
        <option value="Technology">Technology</option>
      </Select>

      <BlogEditor setContent={setContent} content={content} />
    </VStack>
  );
};

export default CreateForm;
