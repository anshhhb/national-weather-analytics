from abc import ABC, abstractmethod


class WeatherDataSource(ABC):

    @abstractmethod
    def fetch(self):
        pass

    @abstractmethod
    def validate(self, data):
        pass

    @abstractmethod
    def normalize(self, data):
        pass

    @abstractmethod
    def health_check(self):
        pass

    @abstractmethod
    def get_metadata(self):
        pass