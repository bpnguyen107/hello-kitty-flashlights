import React, { useState, useEffect } from 'react';
import { Button, Image, View, Platform, Text } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "../backend/firebaseConfig";
import { getStorage, ref, uploadBytes, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getFirestore, doc, setDoc, getDoc, addDoc, collection, updateDoc } from 'firebase/firestore';
import { TextInput, TouchableOpacity } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../backend/firebaseConfig';


initializeApp(firebaseConfig);
const firestore = getFirestore();

export default function ForumScreen2(navigation) {
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState("");
  const [postID, setPostID] = useState("");
  const [imageUrl, setImageUrl] = useState(undefined);

  const [uploadTime, setUploadTime] = useState("04:20 April 20, 2069");
  const [username, setUserName] = useState("Anonymous");
  const [userProfilePic , setUserProfilePic] = useState("")

  const hasUnsavedChanges = Boolean(image);

  const navigate = useNavigation();

  //function to give camera roll permissions / not important
  /*
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          alert('Sorry, we need camera roll permissions to make this work!');
        }
      }
    })();
  }, []);
  */
  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.1,
    });


    if (!result.canceled) {
      setImage(result.assets[0].uri);
    } 
  };


    async function uploadMessages() {
        const currentDate = Date.now()
        try {
              const messageData = collection(firestore, `discussionForum`)
              async function addANewDocument() {
                const newDoc = await addDoc(messageData, {
                  message: message,
                  date: currentDate,
              })
              setPostID(newDoc.id)
              
              const postData = doc(firestore, `discussionForum/${newDoc.id}`)
              console.log("POSTID: ", newDoc.id)
              const docData = {
                id: newDoc.id,
              };
              await updateDoc(postData, docData);
            }
            await addANewDocument();
          }
          catch(error){
            console.log("couldn't create a message in firebase cloudfire") 
          }
    }

  useEffect(() => {
    if (postID == "")
      return;
    async function uploadImage() {
      if (image != null) {
        const date = Date.now()
        console.log("Image Uploaded")
        const img = await fetch(image);
        const ImageRef = ref(getStorage(), `${postID}.img`);
        const bytes = await img.blob();

        const metadata = {
          customMetadata: {message: message,
          date: date},
        };
        const imageUpload = await uploadBytesResumable(ImageRef, bytes, metadata)
        .then(
          async () => {
            console.log("Upload Finish")
            const storage = getStorage(); 
            const reference = ref(storage, `${postID}.img`)
            await getDownloadURL(reference).then((x) => {
              setImageUrl(x);
              console.log("Image Url: ", x)
              navigate.navigate("Forums") //navigate to forums page //timings may be off
            })
        }).catch((error) => {
            console.log(error.message)
        })
      }
    }
    uploadImage();

    //setUploadTime(getDate());
    //setUserName(auth.currentUser?.displayName);
    if(auth.currentUser?.displayName != null){
      setUserName(auth.currentUser.displayName)
      setUserProfilePic(auth.currentUser.photoURL)
    }

  }, [postID])

  
  useEffect(() => {
    console.log("Uploading Image Uri");

    const currentDate = getDate();
    async function updateImageUri() {
    const ImageData = doc(firestore, `discussionForum/${postID}`)
    const docData = {
      imageUri: imageUrl,
      username: username,
      uploadTime: currentDate,
      profilePic: userProfilePic

    };
    await updateDoc(ImageData, docData)
  }
    updateImageUri().then(console.log("upload success"));

    //reset the post id
    setPostID("");
    //reset the screen
    setImage(null);
    setMessage("");
  }, [imageUrl])

  function getDate() {
    const postMonth = monthString();
    const postDay = new Date().getDay();
    const postYear = new Date().getFullYear();
    const postHour = new Date().getHours();
    const postMinutes = new Date().getMinutes();
    //console.log(`Date: ${postHour}:${postMinutes} ${postMonth} ${postMinutes}, ${postYear}`);
    return (`${postHour}:${postMinutes} ${postMonth} ${postDay}, ${postYear}`)
  }

  function monthString(){
    switch (new Date().getMonth() + 1 ){
      case 1:
        return "January"
      case 2:
        return "Febuary"
      case 3:
        return "March"
      case 4:
        return "April"
      case 5:
        return "May"
      case 6:
        return "June"
      case 7:
        return "July"
      case 8:
        return "August"
      case 9:
        return "September"
      case 10:
        return "October"
      case 11:
        return "November"
      case 12:
        return "December"  
      
    }
  }

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Button title="Pick an image from camera roll" onPress={pickImage} />
      {image && <Image source={{ uri: image }} style={{ width: 200, height: 200 }} />}

      {image &&
      <TouchableOpacity>
        <TextInput placeholder="Caption" placeholderTextColor="#003f5c" onChangeText={(message) => setMessage(message)}/>
      </TouchableOpacity>
      }
      {image && message &&
      <Button 
        title="Upload" 
        onPress={() => {
          uploadMessages()
        }}/>
      }

      
    </View>
  );
}