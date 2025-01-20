import {
  Box,
  Button,
  Divider,
  Flex,
  Heading,
  Image,
  Input,
  Select,
  useColorModeValue,
  useToast,
  VStack,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import BlogEditor from "../Editor/BlogEditor";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";

const EditForm = () => {
  const colorScheme = useColorModeValue("blue", "green");
  const toast = useToast();
  const { id } = useParams();
  const [postData, setPostData] = useState({
    _id: "",
    title: "",
    category: "",
    summary: "",
    content: "",
    cover: "",
    author: "",
    createdAt: "",
    updatedAt: "",
  });

  const { token } = useSelector((state) => state.auth.user);

  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false); // To track image upload

  // Cloudinary image upload function
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
      setPostData({ ...postData, cover: data.secure_url }); // Set the Cloudinary image URL
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

  const handleUpdatePost = () => {
    let editedPost = {
      title: postData.title,
      category: postData.category,
      summary: postData.summary,
      content: postData.content,
      cover: postData.cover,
    };

    setIsUpdating(true);
    axios
      .patch(`${import.meta.env.VITE_API_URL}/posts/update/${id}`, editedPost, {
        headers: {
          Authorization: token,
        },
      })
      .then((res) => {
        setIsUpdating(false);
        toast({
          title: "Post Updated",
          status: "success",
          isClosable: true,
          duration: 3000,
        });
        navigate(-1);
      })
      .catch((err) => {
        setIsUpdating(false);
        console.log(err);
        toast({
          title: "Something went wrong, Please check console.",
          status: "error",
          isClosable: true,
          duration: 3000,
        });
      });
  };

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${import.meta.env.VITE_API_URL}/posts/${id}`)
      .then(({ data }) => {
        setLoading(false);
        setPostData(data);
      })
      .catch((err) => {
        setLoading(false);
        toast({
          title: "Something went wrong.",
          description: "Please check for error in console.",
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      });
  }, []);

  const handleChange = (e) => {
    setPostData({ ...postData, [e.target.name]: e.target.value });
  };

  if (loading) {
    return <h1>Loading...</h1>;
  }

  return (
    <VStack spacing={5}>
      <Flex
        justifyContent="space-between"
        alignItems="center"
        w="100%"
        position="sticky"
      >
        <Heading fontSize={{ base: "2xl", md: "4xl" }}>Edit Post</Heading>
        <Button
          colorScheme={colorScheme}
          onClick={handleUpdatePost}
          isLoading={isUpdating}
          loadingText="Updating"
        >
          Update Post
        </Button>
      </Flex>

      <Divider borderColor={"gray.400"} />

      {postData.cover.length > 0 && (
        <>
          <Image w="100%" src={postData.cover} />
        </>
      )}

      {/* Image Upload */}
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
          borderColor="gray.300"
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
              {postData.cover ? "Change Image" : "Add Image"}
            </Box>
          </label>
        </Box>
      </Flex>

      <Input
        type="text"
        placeholder="Topic"
        variant="unstyled"
        fontSize={{ base: "xl", md: "3xl" }}
        size="xl"
        fontWeight="bold"
        name="title"
        value={postData.title}
        onChange={handleChange}
      />

      <Input
        placeholder="㊉ Add a Summary"
        variant="unstyled"
        fontSize={{ base: "xl", md: "2xl" }}
        size="xl"
        name="summary"
        value={postData.summary}
        onChange={handleChange}
      />

      <Select
        fontSize={{ base: "lg", md: "xl" }}
        placeholder="Select category"
        name="category"
        value={postData.category}
        onChange={handleChange}
      >
        <option value="Software Development">Software Development</option>
        <option value="JavaScript">JavaScript</option>
        <option value="Coding">Coding</option>
        <option value="React">React</option>
        <option value="Productivity">Productivity</option>
        <option value="Nodejs">Nodejs</option>
        <option value="Technology">Technology</option>
      </Select>

      <BlogEditor
        setContent={(content) => setPostData({ ...postData, content: content })}
        content={postData.content}
      />
    </VStack>
  );
};

export default EditForm;
