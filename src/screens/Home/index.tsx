import { useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

import { api } from '../../services/api';
import { foodContains } from '../../utils/foodContains';

import { styles } from './styles';

import { Tip } from '../../components/Tip';
import { Item, ItemProps } from '../../components/Item';
import { Button } from '../../components/Button';
import { Loading } from '../../components/Loading';

export function Home() {
  //criando o estado da imagem
  const [selectedImageUri, setSelectedImageUri] = useState('');
  //criando o estado para api
  const [isLoading, setIsLoading] = useState(false);
  //Criando um novo estado para mostrar as informações dos pratos
  const [items, setItems] = useState<ItemProps[]>([]);
  //Criando o estado para armazenar os dados
  const [message, setMessage] = useState('');

  //Função para acesso a galeria do usuário, permissão e coleta da imagem.
  async function handleSelectImage() {
    try{
      //fazendo a solicitação para ter acesso a galeria
      const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();

      //verificando se o acesso foi concedido.
      if(status !== ImagePicker.PermissionStatus.GRANTED){
        return alert('É necessário conceder permissão a galeria de fotos!');
      }

      //Ativando o carregamento da imagem
      setIsLoading(true);

      //tratando a qualidade e liberando a função de corte da imagem
      const response = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4,4],
        quality: 1
      });

      //em caso de cancelamento do envio da imagem
      if(response.canceled){
        return setIsLoading(false);
      }

      //Formatando a imagem para enviar para a API
      if(!response.canceled){
        const imgManipuled = await ImageManipulator.manipulateAsync(
          response.assets[0].uri,
          [{resize: { width: 900}}],
          {
            compress: 1,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true
          }
        );

        setSelectedImageUri(imgManipuled.uri);

        //passando a imagen para a outra função
        foodDetect(imgManipuled.base64);
      }

    } catch(error){
      console.log(error)
    }
  }
  //função para enviar a imagem para a api.
  async function foodDetect(ImageBase64: string | undefined) {
    const response = await api.post(`/v2/models/${process.env.EXPO_PUBLIC_API_MODEL_ID}/versions/${process.env.EXPO_PUBLIC_API_MODEL_VERSION_ID}/outputs`, 
    {
      "user_app_id": {
      "user_id": process.env.EXPO_PUBLI_API_USER_ID,
      "app_id": process.env.EXPO_PUBLIC_API_APP_ID
    },
    "inputs": [
      {
        "data": {
          "image":{
            "base64": ImageBase64
          }
        }
      }
    ]

    });
    //console.log(response.data.outputs[0].data);
    //formatando as informações e mostrando na tela para o usuário.
    const foods = response.data.outputs[0].data.concepts.map((concept: any) => {
      return {
        name: concept.name,
        percentage: `${Math.round(concept.value * 100)}%`
      }
    })

    const isVegetable = foodContains(foods, 'vegetable');
    setMessage(isVegetable ? '' : 'Adicione mais vegetais no seu prato!')

    //chamando a função para executar
    setItems(foods);
    //retornando o estado para false para conseguir anexar outra foto
    setIsLoading(false);
  }


  return (
    <View style={styles.container}>
      <Button onPress={handleSelectImage} disabled={isLoading}/>

      {
        selectedImageUri ?
          <Image
            source={{ uri: selectedImageUri }}
            style={styles.image}
            resizeMode="cover"
          />
          :
          <Text style={styles.description}>
            Selecione a foto do seu prato para analizar.
          </Text>
      }

      <View style={styles.bottom}>
        {
          isLoading ? <Loading/> :
          <>
          {
            message ? <Tip message={message} /> : <Tip message="Alimentos saudáveis no prato."  />
          }

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 24 }}>
            <View style={styles.items}>
              { 
                items.map((item) => (
                  <Item key={item.name} data={item}/>
                ))
              }
              
            </View>
          </ScrollView>
        </>
        }
      </View>
    </View>
  );
}